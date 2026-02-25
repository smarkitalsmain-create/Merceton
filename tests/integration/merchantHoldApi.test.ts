import { describe, it, expect, beforeEach, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"

vi.mock("@/lib/admin-auth", () => ({
  requireAdminForApi: vi.fn(),
}))

vi.mock("@/app/actions/merchant-status", () => ({
  updateMerchantStatus: vi.fn(),
}))

describe("Admin merchant hold API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns auth error when admin is not authorized", async () => {
    const { requireAdminForApi } = await import("@/lib/admin-auth")
    ;(requireAdminForApi as any).mockResolvedValue(
      NextResponse.json({ error: "UNAUTHORIZED", errorCode: "UNAUTHORIZED" }, { status: 401 })
    )

    const { POST } = await import("@/app/api/admin/merchants/[merchantId]/hold/route")
    const req = new NextRequest("http://localhost/api/admin/merchants/m1/hold", {
      method: "POST",
      body: JSON.stringify({ reasonCode: "MANUAL_REVIEW" }),
    } as any)
    const res = await POST(req, { params: { merchantId: "m1" } })

    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBeDefined()
  })

  it("puts merchant on hold when called by admin with valid reason", async () => {
    const { requireAdminForApi } = await import("@/lib/admin-auth")
    const { updateMerchantStatus } = await import("@/app/actions/merchant-status")

    ;(requireAdminForApi as any).mockResolvedValue({
      userId: "admin-1",
      email: "admin@example.com",
      name: "Admin User",
    })

    ;(updateMerchantStatus as any).mockResolvedValue({
      success: true,
      emailsSent: { onHold: true, holdReleased: false, kycApproved: false },
    })

    const { POST } = await import("@/app/api/admin/merchants/[merchantId]/hold/route")
    const req = new NextRequest("http://localhost/api/admin/merchants/m1/hold", {
      method: "POST",
      body: JSON.stringify({ reasonCode: "MANUAL_REVIEW" }),
    } as any)
    const res = await POST(req, { params: { merchantId: "m1" } })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.merchantId).toBe("m1")
    expect(json.newStatus).toBe("ON_HOLD")
  })
})

