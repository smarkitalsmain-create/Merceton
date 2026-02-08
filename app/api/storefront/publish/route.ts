import { NextRequest, NextResponse } from "next/server"
import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/storefront/publish
 * Sets publishedAt = now() for the merchant's storefront
 */
export async function POST(request: NextRequest) {
  try {
    const merchant = await requireMerchant()

    // Get current settings to validate
    const settings = await prisma.storefrontSettings.findUnique({
      where: { merchantId: merchant.id },
    })

    if (!settings) {
      return NextResponse.json(
        { error: "Storefront settings not found. Please save settings first." },
        { status: 404 }
      )
    }

    // Validate CUSTOM_CODE mode has HTML
    if (settings.mode === "CUSTOM_CODE" && (!settings.customHtml || settings.customHtml.trim().length === 0)) {
      return NextResponse.json(
        { error: "Cannot publish custom code storefront without HTML" },
        { status: 400 }
      )
    }

    // Update publishedAt
    const updated = await prisma.storefrontSettings.update({
      where: { merchantId: merchant.id },
      data: {
        publishedAt: new Date(),
      },
      select: {
        publishedAt: true,
      },
    })

    return NextResponse.json({
      publishedAt: updated.publishedAt,
      message: "Storefront published successfully",
    })
  } catch (error: any) {
    console.error("Publish storefront error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to publish storefront" },
      { status: 500 }
    )
  }
}
