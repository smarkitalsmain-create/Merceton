import { prisma } from "@/lib/prisma"
import { GROWTH_FEATURE_KEYS_LIST } from "@/lib/features/featureKeys"
import type { FeatureKey } from "@/lib/features/featureKeys"

export type ResolvedFeatureEntry = {
  enabled: boolean
  value?: unknown
  source: "package" | "override" | "default"
}

/**
 * Resolves effective Growth features for a merchant from assigned pricing package + overrides.
 */
export async function resolveMerchantFeatures(
  merchantId: string
): Promise<Map<FeatureKey, ResolvedFeatureEntry>> {
  const map = new Map<FeatureKey, ResolvedFeatureEntry>()
  for (const k of GROWTH_FEATURE_KEYS_LIST) {
    map.set(k, { enabled: false, source: "default" })
  }

  const feeConfig = await prisma.merchantFeeConfig.findUnique({
    where: { merchantId },
    include: {
      pricingPackage: {
        include: {
          features: { include: { feature: true } },
        },
      },
    },
  })

  if (feeConfig?.pricingPackage?.features) {
    for (const pf of feeConfig.pricingPackage.features) {
      if (!pf.enabled) continue
      const key = pf.feature.key as FeatureKey
      if (!map.has(key)) continue
      map.set(key, {
        enabled: true,
        value: pf.valueJson ?? undefined,
        source: "package",
      })
    }
  }

  const overrides = await prisma.merchantFeatureOverride.findMany({
    where: { merchantId },
    include: { feature: true },
  })

  for (const o of overrides) {
    const key = o.feature.key as FeatureKey
    if (!map.has(key)) continue
    if (o.mode === "DISABLE") {
      map.set(key, { enabled: false, source: "override" })
    } else if (o.mode === "ENABLE") {
      map.set(key, { enabled: true, source: "override" })
    } else if (o.mode === "OVERRIDE") {
      map.set(key, {
        enabled: true,
        value: o.valueJson ?? undefined,
        source: "override",
      })
    }
  }

  return map
}
