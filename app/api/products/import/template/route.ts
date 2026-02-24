export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { toCsv } from "@/lib/csv"

/**
 * GET /api/products/import/template
 * 
 * Download CSV template for product import
 */
export async function GET() {
  const headers = [
    "name",
    "price",
    "sku",
    "description",
    "stock",
    "mrp",
    "hsnOrSac",
    "gstRate",
    "isTaxable",
  ]

  const exampleRows = [
    [
      "Sample Product 1",
      "99.99",
      "SKU-001",
      "This is a sample product description",
      "100",
      "149.99",
      "12345678",
      "18",
      "true",
    ],
    [
      "Sample Product 2",
      "199.99",
      "SKU-002",
      "Another sample product",
      "50",
      "",
      "",
      "",
      "",
    ],
  ]

  const csv = toCsv(headers, exampleRows)

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="product-import-template.csv"',
    },
  })
}
