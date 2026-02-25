/**
 * Merchant feature gating — single source of truth for UI and API.
 * Growth features only (9). Package features + merchant overrides; override wins.
 */

import { cache } from "react"
import { resolveMerchantFeatures } from "@/lib/features/resolver"
import type { FeatureKey } from "@/lib/features/featureKeys"
import { GROWTH_FEATURE_KEYS } from "@/lib/features/featureKeys"

/** Request-scoped cache: same merchantId in one request returns same result */
export const getEffectiveFeatures = cache(resolveMerchantFeatures)

/**
 * Whether the merchant has access to the feature.
 */
export async function canUseFeature(
  merchantId: string,
  featureKey: FeatureKey
): Promise<boolean> {
  const features = await getEffectiveFeatures(merchantId)
  const r = features.get(featureKey)
  return r?.enabled ?? false
}

/**
 * Get merged config for a feature (package + override). Override wins.
 */
export async function getFeatureConfig<T = unknown>(
  merchantId: string,
  featureKey: FeatureKey
): Promise<T | undefined> {
  const features = await getEffectiveFeatures(merchantId)
  const r = features.get(featureKey)
  if (!r?.enabled || r.value == null) return undefined
  return r.value as T
}

/**
 * Product limit: null = unlimited (Growth), number = cap (Starter default 100).
 */
export async function getProductLimit(merchantId: string): Promise<number | null> {
  const features = await getEffectiveFeatures(merchantId)
  const unlimited = features.get(GROWTH_FEATURE_KEYS.G_UNLIMITED_PRODUCTS)
  if (unlimited?.enabled) return null
  return 100 // Starter baseline cap
}
