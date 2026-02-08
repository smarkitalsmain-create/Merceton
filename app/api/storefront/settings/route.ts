import { NextRequest, NextResponse } from "next/server"
import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Default theme config
const DEFAULT_THEME_CONFIG = {
  primaryColor: "#000000",
  headingFont: "Inter",
  buttonStyle: "rounded",
}

/**
 * GET /api/storefront/settings
 * Returns storefront settings for the merchant
 * Creates default settings if none exist
 */
export async function GET(request: NextRequest) {
  try {
    const merchant = await requireMerchant()

    // Try to find existing settings
    let settings = await prisma.storefrontSettings.findUnique({
      where: { merchantId: merchant.id },
    })

    // If no settings exist, create with defaults
    if (!settings) {
      settings = await prisma.storefrontSettings.create({
        data: {
          merchantId: merchant.id,
          theme: "minimal",
          mode: "THEME",
          themeConfig: DEFAULT_THEME_CONFIG,
          publishedAt: null,
        },
      })
    }

    return NextResponse.json({ settings })
  } catch (error: any) {
    console.error("Get storefront settings error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to get storefront settings" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/storefront/settings
 * Updates storefront settings
 */
export async function PUT(request: NextRequest) {
  try {
    const merchant = await requireMerchant()
    const body = await request.json()

    const {
      mode,
      theme,
      themeConfig,
      customHtml,
      customCss,
      customJs,
    } = body

    // Validate mode
    if (mode && !["THEME", "CUSTOM_CODE"].includes(mode)) {
      return NextResponse.json(
        { error: "Invalid mode. Must be THEME or CUSTOM_CODE" },
        { status: 400 }
      )
    }

    // Validate CUSTOM_CODE mode requires customHtml
    if (mode === "CUSTOM_CODE" && (!customHtml || customHtml.trim().length === 0)) {
      return NextResponse.json(
        { error: "customHtml is required when mode is CUSTOM_CODE" },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: any = {}

    if (mode !== undefined) {
      updateData.mode = mode
    }

    if (theme !== undefined) {
      updateData.theme = theme
    }

    if (themeConfig !== undefined) {
      updateData.themeConfig = themeConfig
    }

    if (customHtml !== undefined) {
      updateData.customHtml = customHtml
    }

    if (customCss !== undefined) {
      updateData.customCss = customCss
    }

    if (customJs !== undefined) {
      updateData.customJs = customJs
    }

    // Upsert settings
    const settings = await prisma.storefrontSettings.upsert({
      where: { merchantId: merchant.id },
      update: updateData,
      create: {
        merchantId: merchant.id,
        mode: mode || "THEME",
        theme: theme || "minimal",
        themeConfig: themeConfig || DEFAULT_THEME_CONFIG,
        customHtml: customHtml || null,
        customCss: customCss || null,
        customJs: customJs || null,
        publishedAt: null, // Clear publishedAt when settings change
      },
    })

    return NextResponse.json({ settings })
  } catch (error: any) {
    console.error("Update storefront settings error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update storefront settings" },
      { status: 500 }
    )
  }
}
