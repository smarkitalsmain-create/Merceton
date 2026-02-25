export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

import { NextRequest, NextResponse } from "next/server"
import { requireMerchant } from "@/lib/auth"
import { assertFeature, FeatureDeniedError, featureDeniedResponse } from "@/lib/features"
import { GROWTH_FEATURE_KEYS } from "@/lib/features/featureKeys"
import { prisma } from "@/lib/prisma"
import { getVerificationRecordName } from "@/lib/domains/normalize"
import dns from "dns"
import { promisify } from "util"

const resolveTxt = promisify(dns.resolveTxt)

/**
 * Verify custom domain via DNS TXT record lookup
 * 
 * Checks for TXT record: _merceton-verify.<domain> = <token>
 */
export async function POST(request: NextRequest) {
  try {
    const merchant = await requireMerchant()
    try {
      await assertFeature(merchant.id, GROWTH_FEATURE_KEYS.G_CUSTOM_DOMAIN, "/api/domains/verify")
    } catch (e) {
      if (e instanceof FeatureDeniedError) {
        return featureDeniedResponse(e)
      }
      throw e
    }

    if (!merchant.customDomain || !merchant.domainVerificationToken) {
      return NextResponse.json(
        { error: "No domain configured for verification" },
        { status: 400 }
      )
    }

    if (merchant.domainStatus !== "PENDING") {
      return NextResponse.json(
        { 
          error: `Domain is not in PENDING status. Current status: ${merchant.domainStatus}`,
          currentStatus: merchant.domainStatus,
        },
        { status: 400 }
      )
    }

    const domain = merchant.customDomain
    const expectedToken = merchant.domainVerificationToken
    const recordName = getVerificationRecordName(domain)

    // Perform DNS TXT lookup
    let txtRecords: string[][]
    try {
      txtRecords = await resolveTxt(recordName)
    } catch (error: any) {
      // DNS lookup failed - record not found or DNS error
      // DNS failures are expected sometimes; keep logging minimal

      // Update status to FAILED
      await prisma.merchant.update({
        where: { id: merchant.id },
        data: { domainStatus: "PENDING" },
      })

      return NextResponse.json(
        {
          verified: false,
          error: `DNS TXT record not found. Please ensure you've added the TXT record: ${recordName} = ${expectedToken}. DNS changes may take a few minutes to propagate.`,
          recordName,
          expectedToken,
        },
        { status: 400 }
      )
    }

    // Flatten TXT records (DNS returns array of arrays)
    const allTxtValues = txtRecords.flat()

    // Check if any TXT record matches our token
    const tokenFound = allTxtValues.some((record) => record.trim() === expectedToken)

    if (!tokenFound) {
      // Token mismatch
      await prisma.merchant.update({
        where: { id: merchant.id },
        data: { domainStatus: "PENDING" },
      })

      return NextResponse.json(
        {
          verified: false,
          error: `Verification token mismatch. Found records: ${allTxtValues.join(", ")}. Expected: ${expectedToken}. Please ensure the TXT record value exactly matches the token.`,
          recordName,
          expectedToken,
          foundRecords: allTxtValues,
        },
        { status: 400 }
      )
    }

    // Verification successful - update status
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
      message: "Domain verification successful. Your domain is now verified and ready to use.",
    })
  } catch (error: any) {
    console.error("Verify domain error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to verify domain" },
      { status: 500 }
    )
  }
}
