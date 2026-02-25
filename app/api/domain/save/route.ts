export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { requireMerchant } from "@/lib/auth"
import { assertFeature, FeatureDeniedError } from "@/lib/features"
import { GROWTH_FEATURE_KEYS } from "@/lib/features/featureKeys"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const merchant = await requireMerchant()
    try {
      await assertFeature(merchant.id, GROWTH_FEATURE_KEYS.G_CUSTOM_DOMAIN, "/api/domain/save")
    } catch (e) {
      if (e instanceof FeatureDeniedError) {
        return NextResponse.json(
          { error: "Custom domain is not available on your plan", upgradeRequired: true },
          { status: 403 }
        )
      }
      throw e
    }

    const body = await request.json()
    const { domain } = body

    if (!domain || typeof domain !== "string") {
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 }
      )
    }

    // Normalize domain: lowercase, trim, remove protocol, remove trailing slash
    let normalized = domain.trim().toLowerCase()
    normalized = normalized.replace(/^https?:\/\//, "") // Remove protocol
    normalized = normalized.replace(/\/$/, "") // Remove trailing slash
    normalized = normalized.split("/")[0] // Remove path if any

    // Basic validation
    if (!normalized || normalized.length === 0) {
      return NextResponse.json(
        { error: "Invalid domain format" },
        { status: 400 }
      )
    }

    // Check if domain is already taken by another merchant
    const existing = await prisma.merchant.findFirst({
      where: { customDomain: normalized },
    })

    if (existing && existing.id !== merchant.id) {
      return NextResponse.json(
        { error: "This domain is already in use by another store" },
        { status: 409 }
      )
    }

    // Generate verification token: verify_<merchantId>_<random>
    // Use existing token if merchant already has one, otherwise generate new
    let token = merchant.domainVerificationToken
    if (!token) {
      const random = crypto.randomBytes(8).toString("hex")
      token = `verify_${merchant.id}_${random}`
    }

    // Update merchant
    const updated = await prisma.merchant.update({
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

    return NextResponse.json({
      merchant: updated,
      message: "Domain saved. Please add the DNS TXT record to verify.",
    })
  } catch (error) {
    console.error("Save domain error:", error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: "Failed to save domain" },
      { status: 500 }
    )
  }
}
