/**
 * Feature gating types.
 * FeatureKey is defined in featureKeys.ts (canonical list).
 */

import type { FeatureKey } from "./featureKeys"
export type { FeatureKey, GrowthFeatureKey } from "./featureKeys"
export {
  GROWTH_FEATURE_KEYS,
  GROWTH_FEATURE_KEYS_LIST,
  GROWTH_FEATURES_BY_CATEGORY,
  isGrowthFeatureKey,
} from "./featureKeys"

export interface ResolvedFeature {
  enabled: boolean
  value?: unknown
  source: "package" | "override" | "default"
}

export type ResolvedFeatures = Map<FeatureKey, ResolvedFeature>

export class FeatureDeniedError extends Error {
  constructor(
    public featureKey: string,
    public upgradeRequired: boolean = true,
    message?: string
  ) {
    super(message || `Feature ${featureKey} is not available`)
    this.name = "FeatureDeniedError"
  }

  toJSON() {
    return {
      error: this.message,
      featureKey: this.featureKey,
      upgradeRequired: this.upgradeRequired,
    }
  }
}
