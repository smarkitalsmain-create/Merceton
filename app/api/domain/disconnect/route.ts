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
      await assertFeature(merchant.id, GROWTH_FEATURE_KEYS.G_CUSTOM_DOMAIN, "/api/domain/disconnect")
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
        { error: "No domain configured to disconnect" },
        { status: 400 }
      )
    }

    const domain = merchant.customDomain

    // Clear domain configuration and update domain claims
    const updated = await prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        customDomain: null,
        domainStatus: "PENDING",
        domainVerificationToken: null,
        domainVerifiedAt: null,
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
      message: "Domain disconnected successfully",
    })
  } catch (error) {
    console.error("Disconnect domain error:", error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: "Failed to disconnect domain" },
      { status: 500 }
    )
  }
}
