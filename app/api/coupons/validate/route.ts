export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

import { NextRequest, NextResponse } from "next/server"
import { canUseFeature, FeatureDeniedError, featureDeniedResponse } from "@/lib/features"
import { GROWTH_FEATURE_KEYS } from "@/lib/features/featureKeys"

/**
 * GET /api/coupons/validate
 * Requires G_COUPONS for the merchant.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get("code")
    const merchantId = url.searchParams.get("merchantId")
    const amount = url.searchParams.get("amount")
    const email = url.searchParams.get("email")

    if (!code || !merchantId || !amount) {
      return NextResponse.json(
        { error: "Missing required parameters: code, merchantId, amount" },
        { status: 400 }
      )
    }

    const canUse = await canUseFeature(merchantId as any, GROWTH_FEATURE_KEYS.G_COUPONS)
    if (!canUse) {
      // Feature gating disabled – treat as not enabled
      return NextResponse.json(
        { valid: false, reason: "NOT_ENABLED" },
        { status: 200 }
      )
    }

    // Coupons feature is logically enabled, but database is not provisioned.
    // Always return NOT_ENABLED so clients can handle gracefully.
    return NextResponse.json(
      { valid: false, reason: "NOT_ENABLED" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Coupon validation error:", error)
    return NextResponse.json(
      { error: "Failed to validate coupon" },
      { status: 500 }
    )
  }
}
