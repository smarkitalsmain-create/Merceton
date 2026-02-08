import { NextRequest, NextResponse } from "next/server"
import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const merchant = await requireMerchant()

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
