/**
 * Integration tests for product CSV import API
 */

import { describe, it, expect, beforeEach, vi } from "vitest"
import { PrismaClient } from "@prisma/client"
import { NextRequest } from "next/server"
import { POST } from "@/app/api/products/import/route"

// Mock auth
vi.mock("@/lib/auth", () => ({
  authorizeRequest: vi.fn().mockResolvedValue({
    merchant: { id: "test-merchant-id" },
    user: { id: "test-user-id" },
  }),
}))

// Mock feature gating
vi.mock("@/lib/features", () => ({
  assertFeature: vi.fn().mockResolvedValue(undefined),
  getProductLimit: vi.fn().mockResolvedValue(1000),
}))

describe("Product CSV Import API", () => {
  let prisma: PrismaClient
  let testMerchantId: string

  beforeEach(async () => {
    prisma = new PrismaClient()
    
    // Create test merchant
    const merchant = await prisma.merchant.create({
      data: {
        slug: `test-merchant-${Date.now()}`,
        displayName: "Test Merchant",
      },
    })
    testMerchantId = merchant.id

    // Clear mocks
    vi.clearAllMocks()
  })

  it("should reject non-CSV files", async () => {
    const file = new File(["test content"], "test.txt", { type: "text/plain" })
    const formData = new FormData()
    formData.append("file", file)

    const request = new NextRequest("http://localhost/api/products/import", {
      method: "POST",
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain("CSV file")
  })

  it("should reject empty CSV files", async () => {
    const file = new File([""], "test.csv", { type: "text/csv" })
    const formData = new FormData()
    formData.append("file", file)

    const request = new NextRequest("http://localhost/api/products/import", {
      method: "POST",
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain("empty")
  })

  it("should reject CSV files exceeding row limit", async () => {
    // Create a CSV with 1001 rows (exceeds MAX_ROWS = 1000)
    const headers = "name,price\n"
    const rows = Array.from({ length: 1001 }, (_, i) => `Product ${i},99.99\n`).join("")
    const csv = headers + rows

    const file = new File([csv], "test.csv", { type: "text/csv" })
    const formData = new FormData()
    formData.append("file", file)

    const request = new NextRequest("http://localhost/api/products/import", {
      method: "POST",
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain("exceeds maximum")
  })

  it("should reject CSV files missing required columns", async () => {
    const csv = "sku,description\nSKU-001,Test product"
    const file = new File([csv], "test.csv", { type: "text/csv" })
    const formData = new FormData()
    formData.append("file", file)

    const request = new NextRequest("http://localhost/api/products/import", {
      method: "POST",
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain("Missing required columns")
    expect(data.missingColumns).toContain("name")
    expect(data.missingColumns).toContain("price")
  })

  it("should import valid products successfully", async () => {
    const csv = `name,price,sku,description,stock
Product 1,99.99,SKU-001,Description 1,100
Product 2,199.99,SKU-002,Description 2,50`

    const file = new File([csv], "test.csv", { type: "text/csv" })
    const formData = new FormData()
    formData.append("file", file)
    formData.append("mode", "partial_success")

    const request = new NextRequest("http://localhost/api/products/import", {
      method: "POST",
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.result.inserted).toBe(2)
    expect(data.result.totalRows).toBe(2)

    // Verify products were created
    const products = await prisma.product.findMany({
      where: { merchantId: testMerchantId },
    })
    expect(products).toHaveLength(2)
    expect(products[0].name).toBe("Product 1")
    expect(products[0].price).toBe(9999) // 99.99 * 100 (paise)
    expect(products[0].sku).toBe("SKU-001")
  })

  it("should detect and skip duplicate SKUs within file", async () => {
    const csv = `name,price,sku
Product 1,99.99,SKU-001
Product 2,199.99,SKU-001
Product 3,299.99,SKU-002`

    const file = new File([csv], "test.csv", { type: "text/csv" })
    const formData = new FormData()
    formData.append("file", file)
    formData.append("mode", "partial_success")

    const request = new NextRequest("http://localhost/api/products/import", {
      method: "POST",
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.result.duplicates.withinFile).toHaveLength(1)
    expect(data.result.duplicates.withinFile[0].rowNumber).toBe(3) // Second occurrence
    expect(data.result.inserted).toBe(2) // Only first occurrence and unique SKU inserted
  })

  it("should detect and skip duplicate SKUs in database", async () => {
    // Create existing product with SKU
    await prisma.product.create({
      data: {
        merchantId: testMerchantId,
        name: "Existing Product",
        price: 5000,
        sku: "SKU-EXISTING",
      },
    })

    const csv = `name,price,sku
Product 1,99.99,SKU-EXISTING
Product 2,199.99,SKU-NEW`

    const file = new File([csv], "test.csv", { type: "text/csv" })
    const formData = new FormData()
    formData.append("file", file)
    formData.append("mode", "partial_success")

    const request = new NextRequest("http://localhost/api/products/import", {
      method: "POST",
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.result.duplicates.inDatabase).toHaveLength(1)
    expect(data.result.duplicates.inDatabase[0].sku).toBe("SKU-EXISTING")
    expect(data.result.inserted).toBe(1) // Only new SKU inserted
  })

  it("should validate rows and report errors", async () => {
    const csv = `name,price,sku
,99.99,SKU-001
Product 2,,SKU-002
Product 3,-10,SKU-003
Product 4,0,SKU-004
Product 5,99.99,SKU-005`

    const file = new File([csv], "test.csv", { type: "text/csv" })
    const formData = new FormData()
    formData.append("file", file)
    formData.append("mode", "partial_success")

    const request = new NextRequest("http://localhost/api/products/import", {
      method: "POST",
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.result.errors.length).toBeGreaterThan(0)
    expect(data.result.inserted).toBe(1) // Only valid row (Product 5)
  })

  it("should respect product limit", async () => {
    // Create products up to limit
    const limit = 100
    await prisma.product.createMany({
      data: Array.from({ length: limit }, (_, i) => ({
        merchantId: testMerchantId,
        name: `Existing Product ${i}`,
        price: 1000,
      })),
    })

    const csv = `name,price
Product 1,99.99
Product 2,199.99`

    const file = new File([csv], "test.csv", { type: "text/csv" })
    const formData = new FormData()
    formData.append("file", file)
    formData.append("mode", "partial_success")

    const request = new NextRequest("http://localhost/api/products/import", {
      method: "POST",
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.result.inserted).toBe(0) // No products inserted (limit reached)
    expect(data.result.skipped).toBe(2)
  })
})
