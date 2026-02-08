import { NextRequest, NextResponse } from "next/server"
import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const merchant = await requireMerchant()

    if (!merchant.customDomain || !merchant.domainVerificationToken) {
      return NextResponse.json(
        { error: "No domain configured for verification" },
        { status: 400 }
      )
    }

    if (merchant.domainStatus !== "PENDING") {
      return NextResponse.json(
        { error: "Domain is not in PENDING status" },
        { status: 400 }
      )
    }

    // Mock verification - just check if token exists
    // In real implementation, this would do DNS lookup
    // For now, we'll just verify the token matches what we stored
    const token = merchant.domainVerificationToken

    if (token) {
      // Mock: Assume verification passes if token exists
      // In production, this would check DNS TXT record
      const updated = await prisma.merchant.update({
        where: { id: merchant.id },
        data: {
          domainStatus: "VERIFIED",
          domainVerifiedAt: new Date(),
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
        verified: true,
        merchant: updated,
        message: "Domain verification successful (mock)",
      })
    }

    return NextResponse.json({
      verified: false,
      merchant,
      message: "Verification failed",
    })
  } catch (error: any) {
    console.error("Verify domain error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to verify domain" },
      { status: 500 }
    )
  }
}
