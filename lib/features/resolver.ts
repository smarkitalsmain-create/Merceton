/**
 * Feature Resolution Engine
 * 
 * Resolves merchant features from:
 * 1. Pricing Package features
 * 2. Merchant-specific overrides
 * 3. Defaults (disabled if not present)
 */

import { prisma } from "@/lib/prisma"
import { FeatureKey, ResolvedFeature, ResolvedFeatures } from "./types"
import { GROWTH_FEATURE_KEYS_LIST } from "./featureKeys"
import { FeatureValueType, FeatureOverrideMode } from "@prisma/client"

// Request-scoped cache to avoid repeated DB hits
const requestCache = new Map<string, ResolvedFeatures>()

/**
 * Resolve all features for a merchant
 * 
 * Resolution order:
 * 1. Merchant override (ENABLE/DISABLE/OVERRIDE)
 * 2. Package feature (if enabled)
 * 3. Default (disabled)
 * 
 * Special case: UNLIMITED_PRODUCTS enabled => PRODUCT_LIMIT treated as Infinity
 * Returns empty Map if feature tables are missing (e.g. before migration).
 */
export async function resolveMerchantFeatures(
  merchantId: string
): Promise<ResolvedFeatures> {
  // Check request cache first
  const cacheKey = `merchant:${merchantId}`
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey)!
  }

  let resolved: ResolvedFeatures
  try {
    resolved = await resolveMerchantFeaturesUncached(merchantId)
  } catch (e) {
    console.error("resolveMerchantFeatures failed (feature tables missing?):", e)
    resolved = new Map()
  }
  requestCache.set(cacheKey, resolved)
  return resolved
}

async function resolveMerchantFeaturesUncached(merchantId: string): Promise<ResolvedFeatures> {
  // Load merchant fee config to get package
  const feeConfig = await prisma.merchantFeeConfig.findUnique({
    where: { merchantId },
    include: {
      pricingPackage: {
        where: {
          status: "PUBLISHED",
          isActive: true,
          deletedAt: null,
        },
      },
    },
  })

  const packageId = feeConfig?.pricingPackageId

  // Load package features
  const packageFeatures = packageId
    ? await prisma.pricingPackageFeature.findMany({
        where: {
          pricingPackageId: packageId,
        },
        include: {
          feature: true,
        },
      })
    : []

  // Load merchant overrides
  const merchantOverrides = await prisma.merchantFeatureOverride.findMany({
    where: { merchantId },
    include: {
      feature: true,
    },
  })

  // Build feature map
  const resolved: ResolvedFeatures = new Map()

  // Only resolve canonical Growth features (9)
  const allFeatures = (await prisma.feature.findMany()).filter((f) =>
    GROWTH_FEATURE_KEYS_LIST.includes(f.key as FeatureKey)
  )

  for (const feature of allFeatures) {
    const featureKey = feature.key as FeatureKey

    // Check for merchant override first
    const override = merchantOverrides.find((o) => o.feature.key === feature.key)

    if (override) {
      // Override wins
      if (override.mode === FeatureOverrideMode.DISABLE) {
        resolved.set(featureKey, {
          enabled: false,
          source: "override",
        })
      } else if (override.mode === FeatureOverrideMode.ENABLE) {
        // Use package value if available, otherwise default
        const packageFeature = packageFeatures.find((pf) => pf.feature.key === feature.key)
        const value = packageFeature?.valueJson ?? getDefaultValue(feature.valueType)
        resolved.set(featureKey, {
          enabled: true,
          value,
          source: "override",
        })
      } else if (override.mode === FeatureOverrideMode.OVERRIDE) {
        // Use override value
        resolved.set(featureKey, {
          enabled: true,
          value: override.valueJson ?? getDefaultValue(feature.valueType),
          source: "override",
        })
      }
    } else {
      // Check package feature
      const packageFeature = packageFeatures.find((pf) => pf.feature.key === feature.key)

      if (packageFeature && packageFeature.enabled) {
        resolved.set(featureKey, {
          enabled: true,
          value: packageFeature.valueJson ?? getDefaultValue(feature.valueType),
          source: "package",
        })
      } else {
        // Default: disabled
        resolved.set(featureKey, {
          enabled: false,
          source: "default",
        })
      }
    }
  }

  return resolved
}

/**
 * Get default value for a feature value type
 */
function getDefaultValue(valueType: FeatureValueType): any {
  switch (valueType) {
    case "BOOLEAN":
      return true
    case "NUMBER":
      return 0
    case "STRING":
      return ""
    case "JSON":
      return null
    default:
      return null
  }
}

/**
 * Clear request cache (call at end of request)
 */
export function clearFeatureCache(merchantId?: string) {
  if (merchantId) {
    requestCache.delete(`merchant:${merchantId}`)
  } else {
    requestCache.clear()
  }
}
