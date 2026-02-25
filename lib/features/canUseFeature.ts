/**
 * Production-grade feature gate: resolves merchant's package features + overrides,
 * caches per request, returns boolean for a feature key.
 * Use for UI and API checks.
 */

export {
  canUseFeature,
  getEffectiveFeatures,
  getFeatureConfig,
  getProductLimit,
} from "@/lib/gating/canUse"
