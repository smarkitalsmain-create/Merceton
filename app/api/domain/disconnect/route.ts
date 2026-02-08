import { NextRequest, NextResponse } from "next/server"
import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const merchant = await requireMerchant()

    // Clear domain configuration
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
