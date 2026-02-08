import { NextRequest, NextResponse } from "next/server"
import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
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

    // Normalize domain: lowercase, trim, remove protocol, remove www, remove trailing slash
    let normalized = customDomain.trim().toLowerCase()
    normalized = normalized.replace(/^https?:\/\//, "") // Remove protocol
    normalized = normalized.replace(/^www\./, "") // Remove www
    normalized = normalized.replace(/\/$/, "") // Remove trailing slash
    normalized = normalized.split("/")[0] // Remove path if any

    // Basic validation
    if (!normalized || normalized.length === 0) {
      return NextResponse.json(
        { error: "Invalid domain format" },
        { status: 400 }
      )
    }

    // Prevent using platform domain
    const platformDomains = process.env.PLATFORM_DOMAINS?.split(",").map((d) =>
      d.trim().toLowerCase().replace(/^www\./, "")
    ) || ["localhost", "127.0.0.1"]
    
    if (platformDomains.includes(normalized)) {
      return NextResponse.json(
        { error: "Cannot use platform domain as custom domain" },
        { status: 400 }
      )
    }

    // Check if domain is already taken by another merchant
    const existing = await prisma.merchant.findUnique({
      where: { customDomain: normalized },
    })

    if (existing && existing.id !== merchant.id) {
      return NextResponse.json(
        { error: "This domain is already in use by another store" },
        { status: 409 }
      )
    }

    // Generate verification token (random string)
    const token = crypto.randomBytes(16).toString("hex")

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
      dnsInstructions: {
        type: "TXT",
        name: `_sellarity.${normalized}`,
        value: token,
      },
      message: "Domain saved. Please add the DNS TXT record to verify.",
    })
  } catch (error: any) {
    console.error("Add domain error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to add domain" },
      { status: 500 }
    )
  }
}
