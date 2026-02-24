/**
 * CSV Product Import Utilities
 * 
 * Handles parsing, validation, and importing of product CSV files.
 */

import { z } from "zod"

/**
 * CSV Row Schema
 * Validates a single row from the CSV file
 */
export const csvProductRowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.coerce.number().positive("Price must be greater than 0"),
  sku: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  stock: z.coerce.number().int().min(0).default(0).optional(),
  mrp: z.coerce.number().positive().optional().nullable(),
  hsnOrSac: z.string().optional().nullable(),
  gstRate: z.coerce.number().int().min(0).max(100).optional().nullable(),
  isTaxable: z.coerce.boolean().default(true).optional(),
})

export type CsvProductRow = z.infer<typeof csvProductRowSchema>

/**
 * Validation result for a single row
 */
export interface RowValidationResult {
  rowNumber: number
  data: Partial<CsvProductRow>
  errors: string[]
  isValid: boolean
}

/**
 * Import result summary
 */
export interface ImportResult {
  totalRows: number
  validRows: number
  invalidRows: number
  inserted: number
  skipped: number
  errors: RowValidationResult[]
  duplicates: {
    withinFile: Array<{ rowNumber: number; sku: string }>
    inDatabase: Array<{ rowNumber: number; sku: string }>
  }
}

/**
 * Validate a single CSV row
 */
export function validateCsvRow(
  row: Record<string, any>,
  rowNumber: number
): RowValidationResult {
  const errors: string[] = []

  // Normalize row data (trim strings, handle empty values)
  // Use a generic record for normalization; Zod will enforce the final shape.
  const normalized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = key.trim().toLowerCase()
    if (value === null || value === undefined || value === "") {
      // Leave as undefined – required fields will be caught by Zod,
      // optional/nullable fields accept undefined.
      continue
    } else if (typeof value === "string") {
      normalized[normalizedKey] = value.trim()
    } else {
      normalized[normalizedKey] = value
    }
  }

  // Validate using Zod schema
  const result = csvProductRowSchema.safeParse(normalized)

  if (!result.success) {
    for (const error of result.error.errors) {
      errors.push(`${error.path.join(".")}: ${error.message}`)
    }
  }

  return {
    rowNumber,
    data: result.success ? result.data : normalized,
    errors,
    isValid: result.success,
  }
}

/**
 * Detect duplicate SKUs within the file
 */
export function detectDuplicatesWithinFile(
  rows: RowValidationResult[]
): Array<{ rowNumber: number; sku: string }> {
  const skuMap = new Map<string, number[]>()
  const duplicates: Array<{ rowNumber: number; sku: string }> = []

  for (const row of rows) {
    if (row.isValid && row.data.sku) {
      const sku = row.data.sku.toLowerCase().trim()
      if (!skuMap.has(sku)) {
        skuMap.set(sku, [])
      }
      skuMap.get(sku)!.push(row.rowNumber)
    }
  }

  // Find SKUs that appear more than once
  skuMap.forEach((rowNumbers, sku) => {
    if (rowNumbers.length > 1) {
      // Add all occurrences except the first one as duplicates
      for (let i = 1; i < rowNumbers.length; i++) {
        duplicates.push({ rowNumber: rowNumbers[i], sku })
      }
    }
  })

  return duplicates
}

/**
 * Normalize CSV headers (case-insensitive, trim whitespace)
 */
export function normalizeHeaders(headers: string[]): string[] {
  return headers.map((h) => h.trim().toLowerCase())
}

/**
 * Parse CSV row into object using normalized headers
 */
export function parseCsvRow(
  row: string[],
  headers: string[]
): Record<string, any> {
  const normalizedHeaders = normalizeHeaders(headers)
  const obj: Record<string, any> = {}

  for (let i = 0; i < normalizedHeaders.length; i++) {
    const header = normalizedHeaders[i]
    const value = row[i]?.trim() || ""
    obj[header] = value === "" ? null : value
  }

  return obj
}
