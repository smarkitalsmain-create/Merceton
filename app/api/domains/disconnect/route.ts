export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const merchant = await requireMerchant()

    if (!merchant.customDomain) {
      return NextResponse.json(
        { error: "No domain configured to disconnect" },
        { status: 400 }
      )
    }

    const domain = merchant.customDomain

    // Clear domain configuration and update domain claims
    const updated = await prisma.$transaction(async (tx) => {
      // Update merchant
      const updatedMerchant = await tx.merchant.update({
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

      // Mark domain claims as released
      await tx.domainClaim.updateMany({
        where: {
          domain: domain,
          merchantId: merchant.id,
        },
        data: {
          releasedAt: new Date(),
        },
      })

      return updatedMerchant
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
