import { NextRequest, NextResponse } from "next/server"
import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveTxt } from "node:dns/promises"

export const runtime = "nodejs" // Required for DNS lookups

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

    // Look up TXT record
    const txtRecordName = `_sellarity.${merchant.customDomain}`
    const expectedValue = merchant.domainVerificationToken || ""

    let verified = false
    let message = ""

    try {
      // resolveTxt returns string[][] - array of arrays of strings
      const records = await resolveTxt(txtRecordName)
      
      // Flatten the nested array structure
      // Each record is an array of strings (for long TXT records that are split)
      const allText = records.map((record) => record.join("")).join(" ")

      // Check if the expected token is in the TXT record
      if (allText.includes(expectedValue)) {
        verified = true
        message = "Domain verification successful"

        // Update merchant to VERIFIED
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
          message,
        })
      } else {
        message = `TXT record not found or incorrect. Expected token: ${expectedValue}`
      }
    } catch (dnsError: any) {
      if (dnsError.code === "ENOTFOUND" || dnsError.code === "ENODATA") {
        message = "TXT record not found. Please ensure the DNS record has been added and propagated."
      } else {
        message = `DNS lookup failed: ${dnsError.message}`
      }
    }

    return NextResponse.json({
      verified: false,
      merchant,
      message,
    })
  } catch (error) {
    console.error("Verify domain error:", error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: "Failed to verify domain" },
      { status: 500 }
    )
  }
}
