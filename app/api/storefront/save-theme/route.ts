import { NextRequest, NextResponse } from "next/server"
import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const MAX_FIELD_SIZE = 200 * 1024 // 200KB

export async function POST(request: NextRequest) {
  try {
    const merchant = await requireMerchant()
    const body = await request.json()
    const { storeTitle, logoUrl, primaryColor, theme } = body

    // Validate theme
    if (theme && !["minimal", "bold"].includes(theme)) {
      return NextResponse.json(
        { error: "Invalid theme. Must be 'minimal' or 'bold'" },
        { status: 400 }
      )
    }

    // Validate logoUrl size if provided
    if (logoUrl && logoUrl.length > MAX_FIELD_SIZE) {
      return NextResponse.json(
        { error: "Logo URL exceeds maximum length of 200KB" },
        { status: 400 }
      )
    }

    // Build themeConfig JSON
    const themeConfig = {
      storeTitle: storeTitle || merchant.displayName,
      primaryColor: primaryColor || "#000000",
      theme: theme || "minimal",
    }

    // Upsert storefront settings
    const storefront = await prisma.storefrontSettings.upsert({
      where: { merchantId: merchant.id },
      update: {
        mode: "THEME",
        themeConfig,
        logoUrl: logoUrl || null,
        theme: theme || "minimal",
        // Clear custom code fields when switching to theme mode
        customHtml: null,
        customCss: null,
        customJs: null,
        publishedAt: null,
      },
      create: {
        merchantId: merchant.id,
        mode: "THEME",
        themeConfig,
        logoUrl: logoUrl || null,
        theme: theme || "minimal",
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
      message: "Theme saved successfully",
    })
  } catch (error: any) {
    console.error("Error saving theme:", error)
    return NextResponse.json(
      { error: error.message || "Failed to save theme" },
      { status: 500 }
    )
  }
}
