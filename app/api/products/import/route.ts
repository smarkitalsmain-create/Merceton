export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

import { NextRequest, NextResponse } from "next/server"
import { authorizeRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getProductLimit, canUseFeature, featureDeniedResponse, FeatureDeniedError } from "@/lib/features"
import { GROWTH_FEATURE_KEYS } from "@/lib/features/featureKeys"
import {
  validateCsvRow,
  detectDuplicatesWithinFile,
  normalizeHeaders,
  parseCsvRow,
  type ImportResult,
  type RowValidationResult,
} from "@/lib/products/csvImport"

const MAX_ROWS = 1000
const CHUNK_SIZE = 200

/**
 * Parse CSV content using a simple, safe parser
 * Handles quoted fields and escaped quotes
 */
function parseCsv(content: string): string[][] {
  const rows: string[][] = []
  const lines = content.split(/\r?\n/).filter((line) => line.trim())
  
  for (const line of lines) {
    const row: string[] = []
    let current = ""
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"'
          i++
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
        }
      } else if (char === "," && !inQuotes) {
        // Field separator
        row.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }
    
    // Add last field
    row.push(current.trim())
    rows.push(row)
  }
  
  return rows
}

/**
 * POST /api/products/import
 * 
 * Bulk import products from CSV file
 * 
 * Body: multipart/form-data with:
 * - file: CSV file
 * - mode: "all_or_nothing" | "partial_success" (default: "partial_success")
 */
export async function POST(request: NextRequest) {
  try {
    // Authorize request
    const { merchant } = await authorizeRequest()

    const allowed = await canUseFeature(merchant.id, GROWTH_FEATURE_KEYS.G_BULK_CSV)
    if (!allowed) {
      return featureDeniedResponse(new FeatureDeniedError(GROWTH_FEATURE_KEYS.G_BULK_CSV, true))
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const mode = (formData.get("mode") as string) || "partial_success"

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      return NextResponse.json(
        { error: "File must be a CSV file" },
        { status: 400 }
      )
    }

    // Read file content
    const content = await file.text()

    // Parse CSV
    const csvRows = parseCsv(content)
    
    if (csvRows.length === 0) {
      return NextResponse.json(
        { error: "CSV file is empty" },
        { status: 400 }
      )
    }

    // Check row limit
    if (csvRows.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `CSV file exceeds maximum of ${MAX_ROWS} rows` },
        { status: 400 }
      )
    }

    // Extract headers (first row)
    const headers = csvRows[0]
    const normalizedHeaders = normalizeHeaders(headers)

    // Validate required columns
    const requiredColumns = ["name", "price"]
    const missingColumns = requiredColumns.filter(
      (col) => !normalizedHeaders.includes(col)
    )

    if (missingColumns.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required columns: ${missingColumns.join(", ")}`,
          missingColumns,
        },
        { status: 400 }
      )
    }

    // Validate and parse all rows
    const validationResults: RowValidationResult[] = []
    for (let i = 1; i < csvRows.length; i++) {
      const row = parseCsvRow(csvRows[i], headers)
      const result = validateCsvRow(row, i + 1) // Row number (1-indexed, including header)
      validationResults.push(result)
    }

    // Detect duplicates within file
    const duplicatesWithinFile = detectDuplicatesWithinFile(validationResults)

    // Get valid rows (excluding duplicates within file)
    const validRows = validationResults.filter(
      (r) =>
        r.isValid &&
        !duplicatesWithinFile.some((d) => d.rowNumber === r.rowNumber)
    )

    // Check product limit
    const productLimit = await getProductLimit(merchant.id)
    const currentProductCount = await prisma.product.count({
      where: { merchantId: merchant.id },
    })

    // Get existing SKUs from database (for duplicate detection)
    const validSkus = validRows
      .map((r) => r.data.sku)
      .filter((sku): sku is string => !!sku && sku.trim() !== "")

    const existingProducts =
      validSkus.length > 0
        ? await prisma.product.findMany({
            where: {
              merchantId: merchant.id,
              sku: { in: validSkus },
            },
            select: { sku: true },
          })
        : []

    const existingSkus = new Set(
      existingProducts.map((p) => p.sku?.toLowerCase().trim()).filter(Boolean)
    )

    // Detect duplicates in database
    const duplicatesInDatabase: Array<{ rowNumber: number; sku: string }> = []
    for (const row of validRows) {
      if (row.data.sku) {
        const sku = row.data.sku.toLowerCase().trim()
        if (existingSkus.has(sku)) {
          duplicatesInDatabase.push({ rowNumber: row.rowNumber, sku })
        }
      }
    }

    // Filter out database duplicates
    const rowsToInsert = validRows.filter(
      (r) =>
        !duplicatesInDatabase.some((d) => d.rowNumber === r.rowNumber)
    )

    const wouldExceedLimit =
      productLimit !== null && currentProductCount + rowsToInsert.length > productLimit

    if (mode === "all_or_nothing" && (wouldExceedLimit || duplicatesInDatabase.length > 0)) {
      return NextResponse.json(
        {
          error: "Cannot import all rows",
          validationResults,
          duplicates: {
            withinFile: duplicatesWithinFile,
            inDatabase: duplicatesInDatabase,
          },
          wouldExceedLimit,
        },
        { status: 400 }
      )
    }

    // Insert products in chunks
    let inserted = 0
    let skipped = 0

    if (rowsToInsert.length > 0) {
      const maxInsertable =
        productLimit === null
          ? rowsToInsert.length
          : Math.max(0, productLimit - currentProductCount)
      const insertableRows = rowsToInsert.slice(0, maxInsertable)
      skipped = rowsToInsert.length - insertableRows.length

      // Insert in chunks
      for (let i = 0; i < insertableRows.length; i += CHUNK_SIZE) {
        const chunk = insertableRows.slice(i, i + CHUNK_SIZE)

        await prisma.$transaction(
          chunk.map((row) =>
            prisma.product.create({
              data: {
                merchantId: merchant.id,
                name: row.data.name!,
                description: row.data.description || null,
                price: Math.round(row.data.price! * 100), // Convert to paise (cents)
                mrp: row.data.mrp ? Math.round(row.data.mrp * 100) : null,
                sku: row.data.sku || null,
                stock: row.data.stock || 0,
                hsnOrSac: row.data.hsnOrSac || null,
                gstRate: row.data.gstRate || null,
                isTaxable: row.data.isTaxable ?? true,
                isActive: true,
              },
            })
          )
        )

        inserted += chunk.length
      }
    }

    // Build result
    const result: ImportResult = {
      totalRows: csvRows.length - 1, // Exclude header
      validRows: validRows.length,
      invalidRows: validationResults.filter((r) => !r.isValid).length,
      inserted,
      skipped: skipped + duplicatesInDatabase.length + duplicatesWithinFile.length,
      errors: validationResults.filter((r) => !r.isValid),
      duplicates: {
        withinFile: duplicatesWithinFile,
        inDatabase: duplicatesInDatabase,
      },
    }

    return NextResponse.json({
      success: true,
      result,
      message:
        mode === "all_or_nothing"
          ? `Successfully imported ${inserted} products`
          : `Imported ${inserted} products. ${result.skipped} rows skipped.`,
    })
  } catch (error) {
    console.error("Product import error:", error)

    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
      if (error.message.includes("FeatureDeniedError") || error.message.includes("feature")) {
        return NextResponse.json(
          {
            error: "Bulk CSV import is not available on your plan. Upgrade to Growth plan to enable this feature.",
            upgradeRequired: true,
            featureKey: "BULK_PRODUCT_CSV_IMPORT",
          },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      { error: "Failed to import products" },
      { status: 500 }
    )
  }
}
