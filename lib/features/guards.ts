/**
 * Feature Guard Helpers
 * 
 * High-level helpers for checking and asserting feature access.
 */

import { NextResponse } from "next/server"
import { resolveMerchantFeatures } from "./resolver"
import { FeatureKey, FeatureDeniedError } from "./types"
import { prisma } from "@/lib/prisma"

/** Returns 403 JSON with error, featureKey, upgradeRequired for gated API routes */
export function featureDeniedResponse(e: FeatureDeniedError): NextResponse {
  return NextResponse.json(e.toJSON(), { status: 403 })
}

/**
 * Check if merchant can use a feature
 */
export async function canUseFeature(
  merchantId: string,
  featureKey: FeatureKey
): Promise<boolean> {
  const features = await resolveMerchantFeatures(merchantId)
  const feature = features.get(featureKey)
  return feature?.enabled ?? false
}

/**
 * Get feature value (typed)
 */
export async function getFeatureValue<T = any>(
  merchantId: string,
  featureKey: FeatureKey,
  defaultValue?: T
): Promise<T | undefined> {
  const features = await resolveMerchantFeatures(merchantId)
  const feature = features.get(featureKey)

  if (!feature?.enabled) {
    return defaultValue
  }

  return (feature.value ?? defaultValue) as T
}

/**
 * Assert feature is available (throws if not)
 */
export async function assertFeature(
  merchantId: string,
  featureKey: FeatureKey,
  path?: string
): Promise<void> {
  const canUse = await canUseFeature(merchantId, featureKey)

  if (!canUse) {
    // Log denial (best effort, don't crash if logging fails)
    try {
      await prisma.featureAccessLog.create({
        data: {
          merchantId,
          featureKey,
          decision: "DENY",
          reason: `Feature ${featureKey} not enabled for merchant`,
          path: path || null,
        },
      })
    } catch (error) {
      // Log but don't throw
      console.error("Failed to log feature access denial:", error)
    }

    throw new FeatureDeniedError(featureKey, true)
  }

  // Log allow (optional, can be disabled for performance)
  if (process.env.LOG_FEATURE_ALLOWS === "true") {
    try {
      await prisma.featureAccessLog.create({
        data: {
          merchantId,
          featureKey,
          decision: "ALLOW",
          reason: "Feature enabled",
          path: path || null,
        },
      })
    } catch (error) {
      // Silent fail
    }
  }
}

/**
 * Product limit: null = unlimited, number = cap (Starter default 100).
 */
export async function getProductLimit(merchantId: string): Promise<number | null> {
  const { GROWTH_FEATURE_KEYS } = await import("./featureKeys")
  const features = await resolveMerchantFeatures(merchantId)
  if (features.get(GROWTH_FEATURE_KEYS.G_UNLIMITED_PRODUCTS)?.enabled) return null
  return 100
}

/** Throws FeatureDeniedError (return 403 JSON in route). Alias for assertFeature. */
export const requireFeature = assertFeature
