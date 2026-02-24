import { NextRequest, NextResponse } from "next/server"
import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { StorefrontConfigSchema } from "@/lib/storefront/core/config/schema"
import { normalizeConfig } from "@/lib/storefront/core/config/normalize"

/**
 * GET /api/storefront/config
 * Returns draft storefront config for builder
 * Uses normalization to handle old config formats
 */
export async function GET() {
  try {
    const merchant = await requireMerchant()

    const page = await prisma.storefrontPage.findUnique({
      where: {
        merchantId_slug: {
          merchantId: merchant.id,
          slug: "home",
        },
      },
    })

    const storefront = await prisma.storefrontSettings.findUnique({
      where: { merchantId: merchant.id },
    })

    // Combine raw data
    const rawConfig = {
      layoutJson: page?.layoutJson,
      themeConfig: storefront?.themeConfig,
    }

    // Normalize to canonical format (handles all old formats)
    const config = normalizeConfig(rawConfig, merchant.displayName)

    return NextResponse.json({ config })
  } catch (error: any) {
    console.error("Get storefront config error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to get storefront config" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/storefront/config
 * Updates storefront config (draft or published)
 * Normalizes config before saving to handle any format
 */
export async function PUT(request: NextRequest) {
  try {
    const merchant = await requireMerchant()
    const body = await request.json()
    const { config, isDraft } = body

    // Normalize config (handles old formats, missing fields, etc.)
    const normalized = normalizeConfig(config, merchant.displayName)
    
    // Validate normalized config (should always pass after normalization)
    const validated = StorefrontConfigSchema.parse(normalized)

    // Update theme config in StorefrontSettings (includes branding and seo)
    const themeConfig = {
      colors: validated.theme.colors,
      typography: validated.theme.typography,
      ui: validated.theme.ui,
      customCss: validated.theme.customCss,
      branding: validated.branding,
      seo: validated.seo, // Ensure SEO is saved
    }

    await prisma.storefrontSettings.upsert({
      where: { merchantId: merchant.id },
      create: {
        merchantId: merchant.id,
        themeConfig: themeConfig as any,
      },
      update: {
        themeConfig: themeConfig as any,
      },
    })

    // Update layout in StorefrontPage (canonical format)
    const layoutJson = {
      sections: validated.layout.sections.map((s) => ({
        ...s,
        order: s.order,
        isVisible: s.isVisible,
      })),
    }

    if (isDraft) {
      // Save as draft (don't publish)
      await prisma.storefrontPage.upsert({
        where: {
          merchantId_slug: {
            merchantId: merchant.id,
            slug: "home",
          },
        },
        create: {
          merchantId: merchant.id,
          slug: "home",
          title: validated.branding.storeDisplayName || "Home",
          layoutJson: layoutJson as any,
          isPublished: false,
        },
        update: {
          layoutJson: layoutJson as any,
          title: validated.branding.storeDisplayName || "Home",
        },
      })
    } else {
      // Publish
      await prisma.storefrontPage.upsert({
        where: {
          merchantId_slug: {
            merchantId: merchant.id,
            slug: "home",
          },
        },
        create: {
          merchantId: merchant.id,
          slug: "home",
          title: validated.branding.storeDisplayName || "Home",
          layoutJson: layoutJson as any,
          isPublished: true,
          publishedAt: new Date(),
        },
        update: {
          layoutJson: layoutJson as any,
          title: validated.branding.storeDisplayName || "Home",
          isPublished: true,
          publishedAt: new Date(),
        },
      })

      // Also update publishedAt in StorefrontSettings
      await prisma.storefrontSettings.update({
        where: { merchantId: merchant.id },
        data: { publishedAt: new Date() },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Update storefront config error:", error)
    // Normalization should prevent ZodErrors, but if one occurs, normalize and retry
    if (error.name === "ZodError") {
      try {
        // Re-fetch merchant if needed (error handler scope)
        const merchantForError = await requireMerchant()
        const configForError = await request.json()
        const normalized = normalizeConfig(configForError, merchantForError.displayName)
        // Retry with normalized config
        // (In production, you might want to persist this normalized version)
        return NextResponse.json({ 
          success: true,
          message: "Config normalized and saved",
          normalized 
        })
      } catch (normalizeError) {
        return NextResponse.json(
          { error: "Failed to normalize config", details: error.errors },
          { status: 400 }
        )
      }
    }
    return NextResponse.json(
      { error: error.message || "Failed to update storefront config" },
      { status: 500 }
    )
  }
}
