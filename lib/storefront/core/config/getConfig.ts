import { prisma } from "@/lib/prisma"
import { StorefrontConfig } from "./schema"
import { normalizeConfig } from "./normalize"
import { defaultConfig } from "./defaults"

/**
 * Get published storefront config for customer-facing routes
 * Returns null if not published
 */
export async function getPublishedStorefrontConfig(
  merchantId: string
): Promise<StorefrontConfig | null> {
  const page = await prisma.storefrontPage.findUnique({
    where: {
      merchantId_slug: {
        merchantId,
        slug: "home",
      },
    },
  })

  if (!page || !page.isPublished) {
    return null
  }

  return getConfigFromDb(merchantId, page)
}

/**
 * Get draft storefront config for builder/preview
 * Always returns a config (uses defaults if none exists)
 */
export async function getDraftStorefrontConfig(
  merchantId: string
): Promise<StorefrontConfig> {
  const page = await prisma.storefrontPage.findUnique({
    where: {
      merchantId_slug: {
        merchantId,
        slug: "home",
      },
    },
  })

  if (!page) {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { displayName: true },
    })
    return normalizeConfig({}, merchant?.displayName)
  }

  return getConfigFromDb(merchantId, page)
}

/**
 * Helper to get and normalize config from database
 */
async function getConfigFromDb(
  merchantId: string,
  page: { layoutJson: any }
): Promise<StorefrontConfig> {
  const storefront = await prisma.storefrontSettings.findUnique({
    where: { merchantId },
  })

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { displayName: true },
  })

  // Combine raw data from both tables
  // SEO might be at root level, nested in branding, or nested in themeConfig.branding
  const themeConfig = (storefront?.themeConfig as any) || {}
  const rawConfig = {
    layoutJson: page.layoutJson,
    themeConfig: themeConfig,
    branding: themeConfig.branding,
    seo: themeConfig.seo || themeConfig.branding?.seo || null, // Try multiple locations
  }

  // Normalize to canonical format
  return normalizeConfig(rawConfig, merchant?.displayName)
}
