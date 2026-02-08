import { NextRequest, NextResponse } from "next/server"
import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const MAX_FIELD_SIZE = 200 * 1024 // 200KB

export async function POST(request: NextRequest) {
  try {
    const merchant = await requireMerchant()
    const body = await request.json()
    const { customHtml, customCss, customJs } = body

    // Validate field sizes
    if (customHtml && customHtml.length > MAX_FIELD_SIZE) {
      return NextResponse.json(
        { error: "Custom HTML exceeds maximum size of 200KB" },
        { status: 400 }
      )
    }
    if (customCss && customCss.length > MAX_FIELD_SIZE) {
      return NextResponse.json(
        { error: "Custom CSS exceeds maximum size of 200KB" },
        { status: 400 }
      )
    }
    if (customJs && customJs.length > MAX_FIELD_SIZE) {
      return NextResponse.json(
        { error: "Custom JavaScript exceeds maximum size of 200KB" },
        { status: 400 }
      )
    }

    // Validate that HTML is provided
    if (!customHtml || customHtml.trim().length === 0) {
      return NextResponse.json(
        { error: "Custom HTML is required" },
        { status: 400 }
      )
    }

    // Upsert storefront settings
    const storefront = await prisma.storefrontSettings.upsert({
      where: { merchantId: merchant.id },
      update: {
        mode: "CUSTOM_CODE",
        customHtml: customHtml || null,
        customCss: customCss || null,
        customJs: customJs || null,
        // Clear publishedAt when code is updated (needs republishing)
        publishedAt: null,
      },
      create: {
        merchantId: merchant.id,
        mode: "CUSTOM_CODE",
        customHtml: customHtml || null,
        customCss: customCss || null,
        customJs: customJs || null,
      },
      select: {
        id: true,
        mode: true,
        themeConfig: true,
        logoUrl: true,
        theme: true,
        customHtml: true,
        customCss: true,
        customJs: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      storefront,
      message: "Custom code saved successfully",
    })
  } catch (error: any) {
    console.error("Error saving custom code:", error)
    return NextResponse.json(
      { error: error.message || "Failed to save custom code" },
      { status: 500 }
    )
  }
}
