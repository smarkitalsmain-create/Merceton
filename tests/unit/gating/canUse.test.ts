import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  canUseFeature,
  getFeatureConfig,
  getProductLimit,
  getEffectiveFeatures,
} from "@/lib/gating/canUse"
import { GROWTH_FEATURE_KEYS } from "@/lib/features/featureKeys"

vi.mock("react", () => ({
  cache: (fn: (id: string) => Promise<Map<string, { enabled: boolean; value?: unknown; source: string }>>) => fn,
}))

vi.mock("@/lib/features/resolver", () => ({
  resolveMerchantFeatures: vi.fn(),
}))

describe("canUseFeature", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns true when feature is enabled in resolved map", async () => {
    const { resolveMerchantFeatures } = await import("@/lib/features/resolver")
    const map = new Map()
    map.set(GROWTH_FEATURE_KEYS.G_COUPONS, { enabled: true, source: "package" })
    ;(resolveMerchantFeatures as ReturnType<typeof vi.fn>).mockResolvedValue(map)

    const result = await canUseFeature("merchant-1", GROWTH_FEATURE_KEYS.G_COUPONS)
    expect(result).toBe(true)
  })

  it("returns false when feature is disabled in resolved map", async () => {
    const { resolveMerchantFeatures } = await import("@/lib/features/resolver")
    const map = new Map()
    map.set(GROWTH_FEATURE_KEYS.G_COUPONS, { enabled: false, source: "default" })
    ;(resolveMerchantFeatures as ReturnType<typeof vi.fn>).mockResolvedValue(map)

    const result = await canUseFeature("merchant-1", GROWTH_FEATURE_KEYS.G_COUPONS)
    expect(result).toBe(false)
  })

  it("returns false when feature is missing from resolved map", async () => {
    const { resolveMerchantFeatures } = await import("@/lib/features/resolver")
    ;(resolveMerchantFeatures as ReturnType<typeof vi.fn>).mockResolvedValue(new Map())

    const result = await canUseFeature("merchant-1", GROWTH_FEATURE_KEYS.G_CUSTOM_DOMAIN)
    expect(result).toBe(false)
  })
})

describe("getFeatureConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns config when feature is enabled with value", async () => {
    const { resolveMerchantFeatures } = await import("@/lib/features/resolver")
    const map = new Map()
    map.set(GROWTH_FEATURE_KEYS.G_ADV_ANALYTICS, {
      enabled: true,
      value: { dashboard: true },
      source: "package",
    })
    ;(resolveMerchantFeatures as ReturnType<typeof vi.fn>).mockResolvedValue(map)

    const result = await getFeatureConfig<{ dashboard: boolean }>(
      "merchant-1",
      GROWTH_FEATURE_KEYS.G_ADV_ANALYTICS
    )
    expect(result).toEqual({ dashboard: true })
  })

  it("returns undefined when feature is disabled", async () => {
    const { resolveMerchantFeatures } = await import("@/lib/features/resolver")
    const map = new Map()
    map.set(GROWTH_FEATURE_KEYS.G_COUPONS, { enabled: false, source: "default" })
    ;(resolveMerchantFeatures as ReturnType<typeof vi.fn>).mockResolvedValue(map)

    const result = await getFeatureConfig("merchant-1", GROWTH_FEATURE_KEYS.G_COUPONS)
    expect(result).toBeUndefined()
  })
})

describe("getProductLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns null when G_UNLIMITED_PRODUCTS is enabled", async () => {
    const { resolveMerchantFeatures } = await import("@/lib/features/resolver")
    const map = new Map()
    map.set(GROWTH_FEATURE_KEYS.G_UNLIMITED_PRODUCTS, { enabled: true, source: "package" })
    ;(resolveMerchantFeatures as ReturnType<typeof vi.fn>).mockResolvedValue(map)

    const result = await getProductLimit("merchant-1")
    expect(result).toBeNull()
  })

  it("returns 100 when G_UNLIMITED_PRODUCTS is not enabled", async () => {
    const { resolveMerchantFeatures } = await import("@/lib/features/resolver")
    ;(resolveMerchantFeatures as ReturnType<typeof vi.fn>).mockResolvedValue(new Map())

    const result = await getProductLimit("merchant-1")
    expect(result).toBe(100)
  })
})
