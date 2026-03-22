import { NextResponse } from "next/server"

export {
  canUseFeature,
  getEffectiveFeatures,
  getFeatureConfig,
  getProductLimit,
} from "@/lib/gating/canUse"

export class FeatureDeniedError extends Error {
  readonly featureKey: string
  readonly upgradeRequired: boolean

  constructor(featureKey: string, upgradeRequired: boolean) {
    super(`FeatureDeniedError: ${featureKey}`)
    this.name = "FeatureDeniedError"
    this.featureKey = featureKey
    this.upgradeRequired = upgradeRequired
  }
}

export function featureDeniedResponse(error: FeatureDeniedError) {
  return NextResponse.json(
    {
      error: "Feature not available",
      feature: error.featureKey,
      upgrade: error.upgradeRequired,
    },
    { status: 403 }
  )
}
