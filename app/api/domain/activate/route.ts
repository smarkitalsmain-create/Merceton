export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { requireMerchant } from "@/lib/auth"
import { assertFeature, FeatureDeniedError } from "@/lib/features"
import { GROWTH_FEATURE_KEYS } from "@/lib/features/featureKeys"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const merchant = await requireMerchant()
    try {
      await assertFeature(merchant.id, GROWTH_FEATURE_KEYS.G_CUSTOM_DOMAIN, "/api/domain/activate")
    } catch (e) {
      if (e instanceof FeatureDeniedError) {
        return NextResponse.json(
          { error: "Custom domain is not available on your plan", upgradeRequired: true },
          { status: 403 }
        )
      }
      throw e
    }

    if (!merchant.customDomain) {
      return NextResponse.json(
        { error: "No domain configured" },
        { status: 400 }
      )
    }

    if (merchant.domainStatus !== "VERIFIED") {
      return NextResponse.json(
        { error: "Domain must be VERIFIED before activation" },
        { status: 400 }
      )
    }

    // Activate domain
    const updated = await prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        domainStatus: "ACTIVE",
      },
      select: {
        id: true,
        customDomain: true,
        domainStatus: true,
        domainVerificationToken: true,
        domainVerifiedAt: true,
      },
    })

    return NextResponse.json({
      merchant: updated,
      message: "Domain activated successfully",
    })
  } catch (error) {
    console.error("Activate domain error:", error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: "Failed to activate domain" },
      { status: 500 }
    )
  }
}
