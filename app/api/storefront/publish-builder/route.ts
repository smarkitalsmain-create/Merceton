import { NextRequest, NextResponse } from "next/server"
import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const merchant = await requireMerchant()
    const body = await request.json()
    const { builderJson, builderHtml, builderCss } = body

    // Validate data
    if (!builderJson && !builderHtml) {
      return NextResponse.json(
        { error: "Builder data is required" },
        { status: 400 }
      )
    }

    // Update storefront settings and publish
    const storefront = await prisma.storefrontSettings.upsert({
      where: { merchantId: merchant.id },
      update: {
        builderJson: builderJson || null,
        builderHtml: builderHtml || null,
        builderCss: builderCss || null,
        mode: "CUSTOM_CODE",
        publishedAt: new Date(),
        // Also update customHtml and customCss for backward compatibility
        customHtml: builderHtml || null,
        customCss: builderCss || null,
      },
      create: {
        merchantId: merchant.id,
        builderJson: builderJson || null,
        builderHtml: builderHtml || null,
        builderCss: builderCss || null,
        mode: "CUSTOM_CODE",
        publishedAt: new Date(),
        customHtml: builderHtml || null,
        customCss: builderCss || null,
      },
      select: {
        id: true,
        builderJson: true,
        builderHtml: true,
        builderCss: true,
        mode: true,
        publishedAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      storefront,
      message: "Storefront published successfully",
    })
  } catch (error: any) {
    console.error("Error publishing builder:", error)
    return NextResponse.json(
      { error: error.message || "Failed to publish" },
      { status: 500 }
    )
  }
}
