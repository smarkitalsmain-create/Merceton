export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

import { NextRequest, NextResponse } from "next/server"
import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { normalizeDomain, isValidDomainFormat, getVerificationRecordName } from "@/lib/domains/normalize"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const merchant = await requireMerchant()
    const body = await request.json()
    const { customDomain } = body

    if (!customDomain || typeof customDomain !== "string") {
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 }
      )
    }

    // Normalize domain
    let normalized: string
    try {
      normalized = normalizeDomain(customDomain)
    } catch (error: any) {
      return NextResponse.json(
        { error: "Invalid domain format" },
        { status: 400 }
      )
    }

    // Validate domain format
    if (!isValidDomainFormat(normalized)) {
      return NextResponse.json(
        { error: "Invalid domain format. Please enter a valid domain (e.g., example.com)" },
        { status: 400 }
      )
    }

    // Prevent using platform domain
    const platformDomains = process.env.PLATFORM_DOMAINS?.split(",").map((d) =>
      normalizeDomain(d.trim())
    ) || ["localhost", "127.0.0.1"]
    
    if (platformDomains.includes(normalized)) {
      return NextResponse.json(
        { error: "Cannot use platform domain as custom domain" },
        { status: 400 }
      )
    }

    // Check if domain is already taken by another merchant (using unique constraint)
    const existing = await prisma.merchant.findUnique({
      where: { customDomain: normalized },
    })

    if (existing && existing.id !== merchant.id) {
      return NextResponse.json(
        { error: "This domain is already in use by another store" },
        { status: 409 }
      )
    }

    // Generate verification token (32 character hex string)
    const token = crypto.randomBytes(16).toString("hex")

    // Update merchant in transaction with domain claim
    const updated = await prisma.$transaction(async (tx) => {
      // Update merchant
      const updatedMerchant = await tx.merchant.update({
        where: { id: merchant.id },
        data: {
          customDomain: normalized,
          domainStatus: "PENDING",
          domainVerificationToken: token,
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

      // Create domain claim record for audit
      await tx.domainClaim.create({
        data: {
          domain: normalized,
          merchantId: merchant.id,
          status: "PENDING",
          token,
        },
      })

      return updatedMerchant
    })

    const recordName = getVerificationRecordName(normalized)

    return NextResponse.json({
      merchant: updated,
      dnsInstructions: {
        type: "TXT",
        name: recordName,
        value: token,
      },
      message: "Domain saved. Please add the DNS TXT record to verify.",
    })
  } catch (error: any) {
    console.error("Add domain error:", error)

    // Handle unique constraint violation
    if (error.code === "P2002" && error.meta?.target?.includes("customDomain")) {
      return NextResponse.json(
        { error: "This domain is already in use by another store" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: error.message || "Failed to add domain" },
      { status: 500 }
    )
  }
}
