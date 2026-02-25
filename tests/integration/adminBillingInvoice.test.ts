/**
 * Integration tests for admin billing invoice PDF endpoint
 * GET /api/admin/billing/invoice.pdf
 *
 * - 401 without session
 * - 403 without SUPER_ADMIN
 * - 200 returns application/pdf for SUPER_ADMIN (mocked data)
 */

import { describe, it, expect, beforeEach, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"

const mockPdfBuffer = Buffer.from("%PDF-1.4 mock")

vi.mock("@/lib/admin-auth", () => ({
  requireAdminForApi: vi.fn(),
}))

vi.mock("@/lib/billing/queries", () => ({
  getPlatformBillingProfile: vi.fn(),
}))

vi.mock("@/lib/billing/aggregate", () => ({
  aggregateLedgerEntriesForInvoice: vi.fn(),
}))

vi.mock("@/lib/billing/generateInvoicePdf", () => ({
  generateBillingInvoicePdf: vi.fn().mockResolvedValue(mockPdfBuffer),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    merchant: {
      findUnique: vi.fn(),
    },
  },
}))

describe("GET /api/admin/billing/invoice.pdf", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { getPlatformBillingProfile } = await import("@/lib/billing/queries")
    const { aggregateLedgerEntriesForInvoice } = await import("@/lib/billing/aggregate")
    const { prisma } = await import("@/lib/prisma")

    ;(getPlatformBillingProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      legalName: "Platform",
      addressLine1: "Addr",
      state: "09",
      defaultGstRate: 18,
      city: "City",
      pincode: "110001",
      gstin: "",
      email: "",
      phone: "",
    })
    ;(aggregateLedgerEntriesForInvoice as ReturnType<typeof vi.fn>).mockResolvedValue({
      lineItems: [],
      totals: { subtotal: 0, tax: 0, total: 0 },
      taxType: "gst" as const,
    })
    ;(prisma.merchant.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "merchant-1",
      displayName: "Test Merchant",
      onboarding: {
        gstLegalName: "Test",
        invoiceAddressLine1: "Merchant Addr",
        invoiceCity: "",
        invoicePincode: "",
        gstin: null,
        gstState: null,
        invoiceState: null,
        invoiceEmail: "",
        invoicePhone: "",
        legalBusinessName: null,
        storeDisplayName: null,
        gstTradeName: null,
        invoiceAddressLine2: null,
      },
    })
  })

  async function getRoute(
    merchantId: string,
    from: string,
    to: string
  ): Promise<NextResponse> {
    const { GET } = await import("@/app/api/admin/billing/invoice.pdf/route")
    const url = `http://localhost/api/admin/billing/invoice.pdf?merchantId=${encodeURIComponent(merchantId)}&from=${from}&to=${to}`
    return GET(new NextRequest(url)) as Promise<NextResponse>
  }

  it("returns 401 when requireAdminForApi returns unauthorized", async () => {
    const { requireAdminForApi } = await import("@/lib/admin-auth")
    ;(requireAdminForApi as ReturnType<typeof vi.fn>).mockResolvedValue(
      NextResponse.json({ error: "UNAUTHORIZED", errorCode: "UNAUTHORIZED" }, { status: 401 })
    )

    const res = await getRoute("merchant-123", "2025-01-01", "2025-01-31")
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBeDefined()
    expect(body.errorCode).toBe("UNAUTHORIZED")
  })

  it("returns 403 when requireAdminForApi returns forbidden", async () => {
    const { requireAdminForApi } = await import("@/lib/admin-auth")
    ;(requireAdminForApi as ReturnType<typeof vi.fn>).mockResolvedValue(
      NextResponse.json({ error: "FORBIDDEN", errorCode: "FORBIDDEN" }, { status: 403 })
    )

    const res = await getRoute("merchant-123", "2025-01-01", "2025-01-31")
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBeDefined()
    expect(body.errorCode).toBe("FORBIDDEN")
  })

  it("returns 200 with application/pdf for SUPER_ADMIN", async () => {
    const { requireAdminForApi } = await import("@/lib/admin-auth")
    ;(requireAdminForApi as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: "admin-1",
      email: "admin@merceton.com",
      name: "Admin",
    })

    const res = await getRoute("merchant-123", "2025-01-01", "2025-01-31")
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toMatch(/application\/pdf/i)
    expect(res.headers.get("content-disposition")).toMatch(/platform-invoice-merchant-123-2025-01-01-2025-01-31\.pdf/)
    const buf = await res.arrayBuffer()
    expect(buf.byteLength).toBeGreaterThan(0)
  })

  it("returns 400 when merchantId is missing", async () => {
    const { requireAdminForApi } = await import("@/lib/admin-auth")
    ;(requireAdminForApi as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: "admin-1",
      email: "admin@merceton.com",
      name: "Admin",
    })

    const { GET } = await import("@/app/api/admin/billing/invoice.pdf/route")
    const res = await GET(
      new NextRequest("http://localhost/api/admin/billing/invoice.pdf?from=2025-01-01&to=2025-01-31")
    ) as NextResponse
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/merchantId/i)
  })

  it("returns 400 when from/to are missing", async () => {
    const { requireAdminForApi } = await import("@/lib/admin-auth")
    ;(requireAdminForApi as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: "admin-1",
      email: "admin@merceton.com",
      name: "Admin",
    })

    const { GET } = await import("@/app/api/admin/billing/invoice.pdf/route")
    const res = await GET(
      new NextRequest("http://localhost/api/admin/billing/invoice.pdf?merchantId=merchant-123")
    ) as NextResponse
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/from|to/i)
  })

  it("returns 400 when date range exceeds 90 days", async () => {
    const { requireAdminForApi } = await import("@/lib/admin-auth")
    ;(requireAdminForApi as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: "admin-1",
      email: "admin@merceton.com",
      name: "Admin",
    })

    const res = await getRoute("merchant-123", "2025-01-01", "2025-05-01")
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/90/)
  })
})
