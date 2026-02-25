/**
 * Integration test: gated API returns 403 when feature is not enabled
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { FeatureDeniedError } from "@/lib/features"

vi.mock("@/lib/auth", () => ({
  authorizeRequest: vi.fn(),
}))

vi.mock("react", () => ({
  cache: (fn: (id: string) => Promise<unknown>) => fn,
}))

vi.mock("@/lib/features/resolver", () => ({
  resolveMerchantFeatures: vi.fn(),
}))

vi.mock("@/lib/features/guards", () => ({
  canUseFeature: vi.fn(),
  assertFeature: vi.fn().mockImplementation(() => {
    throw new FeatureDeniedError("G_ADV_ANALYTICS", true)
  }),
}))

describe("Gated API returns 403", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const { authorizeRequest } = require("@/lib/auth")
    const { assertFeature } = require("@/lib/features/guards")
    authorizeRequest.mockResolvedValue({
      merchant: { id: "merchant-123", displayName: "Test" },
      user: { authUserId: "user-1", email: "t@t.com" },
    })
    assertFeature.mockImplementation(() => {
      throw new FeatureDeniedError("ANALYTICS_BASIC", true)
    })
  })

  it("GET /api/analytics/sales-by-date returns 403 when ANALYTICS_BASIC is not enabled", async () => {
    const { GET } = await import("@/app/api/analytics/sales-by-date/route")
    const url = "http://localhost/api/analytics/sales-by-date?from=2025-01-01&to=2025-01-31"
    const res = await GET(new NextRequest(url))

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBeDefined()
    expect(body.featureKey).toBe("G_ADV_ANALYTICS")
    expect(body.upgradeRequired).toBe(true)
  })
})
