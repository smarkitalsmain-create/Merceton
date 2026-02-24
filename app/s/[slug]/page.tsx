export const runtime = "nodejs"

import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { z } from "zod"
import { StorefrontHeader } from "@/components/StorefrontHeader"
import { CustomCodeStorefront } from "@/components/CustomCodeStorefront"
import { MaintenanceMode } from "@/components/MaintenanceMode"
import { SectionRenderer } from "@/components/storefront/SectionRenderer"
import { StorefrontFooter } from "@/components/storefront/StorefrontFooter"
import { getPublishedStorefrontConfig, getDraftStorefrontConfig } from "@/lib/storefront/core/config/getConfig"
import { themeToCssVars } from "@/lib/storefront/core/css-vars"
import type { Metadata } from "next"

// Generate metadata from storefront SEO config (safe - uses optional chaining)
export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const merchant = await prisma.merchant.findUnique({
    where: { slug: params.slug, isActive: true },
    select: { id: true, displayName: true },
  })

  if (!merchant) {
    return {}
  }

  // Get published config for metadata (normalized - always has seo)
  const config = await getPublishedStorefrontConfig(merchant.id)
  
  // Safe access with fallbacks (defensive even though config.seo is guaranteed)
  const metaTitle = config?.seo?.metaTitle || config?.branding?.storeDisplayName || merchant.displayName
  const metaDescription = config?.seo?.metaDescription || ""
  const metaKeywords = config?.seo?.metaKeywords || ""
  const ogImage = config?.seo?.ogImage || config?.branding?.banner || null

  return {
    title: metaTitle || merchant.displayName,
    description: metaDescription || undefined,
    keywords: metaKeywords || undefined,
    openGraph: {
      title: metaTitle || merchant.displayName,
      description: metaDescription || undefined,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle || merchant.displayName,
      description: metaDescription || undefined,
      images: config?.seo?.twitterCardImage ? [config.seo.twitterCardImage] : ogImage ? [ogImage] : undefined,
    },
  }
}

// Legacy schema for backward compatibility - footer is now separate
const SectionSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string(),
    type: z.literal("hero"),
    order: z.number().optional(),
    isVisible: z.boolean().optional(),
    settings: z.object({
      headline: z.string(),
      subheadline: z.string().optional(),
      ctaText: z.string().optional(),
      ctaLink: z.string().optional(),
    }),
  }),
  z.object({
    id: z.string(),
    type: z.literal("text"),
    order: z.number().optional(),
    isVisible: z.boolean().optional(),
    settings: z.object({
      title: z.string(),
      body: z.string(),
    }),
  }),
  z.object({
    id: z.string(),
    type: z.literal("productGrid"),
    order: z.number().optional(),
    isVisible: z.boolean().optional(),
    settings: z.object({
      title: z.string(),
      collection: z.enum(["all", "featured"]),
      limit: z.number().int().min(1).max(48),
    }),
  }),
  z.object({
    id: z.string(),
    type: z.literal("banner"),
    order: z.number().optional(),
    isVisible: z.boolean().optional(),
    settings: z.object({
      text: z.string(),
      link: z.string().optional(),
    }),
  }),
  // Footer is deprecated but kept for migration
  z.object({
    id: z.string(),
    type: z.literal("footer"),
    order: z.number().optional(),
    isVisible: z.boolean().optional(),
    settings: z.object({
      brandName: z.string(),
      links: z
        .array(
          z.object({
            label: z.string(),
            href: z.string(),
          })
        )
        .optional()
        .default([]),
    }),
  }),
])

const LayoutSchema = z.object({
  sections: z.array(SectionSchema),
})

export default async function StorePage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  // Fetch merchant - read-only, no auth
  const merchant = await prisma.merchant.findUnique({
    where: { slug: params.slug, isActive: true },
    select: {
      id: true,
      slug: true,
      displayName: true,
      isActive: true,
      accountStatus: true,
    },
  })

  if (!merchant) {
    notFound()
  }

  const isPreview = searchParams?.preview === "true"

  // Preview route must be protected by merchant ownership
  if (isPreview) {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server")
    const supabase = createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      notFound() // Don't reveal preview exists to unauthenticated users
    }
    // Verify merchant ownership
    const userMerchant = await prisma.user.findUnique({
      where: { authUserId: user.id },
      select: { merchantId: true },
    })
    if (!userMerchant || userMerchant.merchantId !== merchant.id) {
      notFound() // Don't reveal preview exists to unauthorized users
    }
  }

  // Try section-based storefront page first
  const page = await prisma.storefrontPage.findUnique({
    where: {
      merchantId_slug: {
        merchantId: merchant.id,
        slug: "home",
      },
    },
  })

  // Fetch store settings to check if store is live
  const storeSettings = await prisma.merchantStoreSettings.findUnique({
    where: { merchantId: merchant.id },
    select: {
      isStoreLive: true,
      storeName: true,
      logoUrl: true,
    },
  })

  // Check if store is live (default to true if settings don't exist)
  const isStoreLive = storeSettings?.isStoreLive ?? true
  if (!isStoreLive || merchant.accountStatus === "ON_HOLD") {
    return <MaintenanceMode storeName={storeSettings?.storeName || merchant.displayName} />
  }

  // Fetch storefront settings separately - read-only, no upsert (legacy theme/custom code)
  const storefront = await prisma.storefrontSettings.findUnique({
    where: { merchantId: merchant.id },
    select: {
      mode: true,
      theme: true,
      themeConfig: true,
      logoUrl: true,
      customHtml: true,
      customCss: true,
      customJs: true,
      publishedAt: true,
    },
  })

  // Use store settings logo if available, otherwise fallback to storefront logo
  const logoUrl = storeSettings?.logoUrl || storefront?.logoUrl || null
  const storeName = storeSettings?.storeName || merchant.displayName

  // Fetch products separately for better performance
  const products = await prisma.product.findMany({
    where: {
      merchantId: merchant.id,
      isActive: true,
      stock: { gt: 0 },
    },
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // If we have a section-based page:
  // - In preview: always render (merchant ownership verified above) using draft config
  // - Not in preview: only render if published, using published config
  if (page && (isPreview || page.isPublished)) {
    const config = isPreview
      ? await getDraftStorefrontConfig(merchant.id)
      : await getPublishedStorefrontConfig(merchant.id)
    
    if (!config) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Store Not Published</h1>
            <p className="text-muted-foreground">
              This storefront is not available yet. Please check back later.
            </p>
          </div>
        </div>
      )
    }

    const themeVars = themeToCssVars(config.theme)
    const displayName = config.branding.storeDisplayName || storeName
    const displayLogo = config.branding.logo || logoUrl

    return (
      <div id="storefront-root" className="min-h-screen flex flex-col" style={themeVars}>
        {config.theme.customCss && (
          <style dangerouslySetInnerHTML={{ __html: config.theme.customCss }} />
        )}
        <StorefrontHeader
          storeSlug={merchant.slug}
          storeName={displayName}
          logoUrl={displayLogo}
        />
          <main className="flex-1">
            <SectionRenderer
              sections={config.layout.sections}
              storeSlug={merchant.slug}
              products={products}
            />
          </main>
        <StorefrontFooter branding={config.branding} />
      </div>
    )
  }

  // Fallback: legacy storefront settings (theme/custom code)
  // Check if storefront is published
  if (!storefront || storefront.publishedAt === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Store Not Published</h1>
          <p className="text-muted-foreground">
            This storefront is not available yet. Please check back later.
          </p>
        </div>
      </div>
    )
  }

  // Render based on mode
  if (storefront.mode === "CUSTOM_CODE" && storefront.customHtml) {
    return (
      <CustomCodeStorefront
        customHtml={storefront.customHtml}
        customCss={storefront.customCss || null}
        customJs={storefront.customJs || null}
      />
    )
  }

  // Render theme-based storefront (mode === "THEME" or fallback)
  return renderThemeStorefront(
    merchant,
    products,
    logoUrl,
    storefront.themeConfig,
    storefront.theme,
    storeName
  )
}

// Helper function to render theme-based storefront
function renderThemeStorefront(
  merchant: { slug: string; displayName: string },
  products: Array<{
    id: string
    name: string
    description: string | null
    price: number
    mrp: number | null
    stock: number
    images: Array<{ url: string; alt: string | null }>
  }>,
  logoUrl: string | null,
  themeConfig: any,
  theme: string | null,
  storeName: string
) {
  // Safe access to themeConfig with fallbacks
  const config = themeConfig && typeof themeConfig === "object" ? themeConfig : {}
  const storeTitle = storeName
  const primaryColor = (config.primaryColor as string) || "#000000"
  const headingFont = (config.headingFont as string) || "Inter"
  const buttonStyle = (config.buttonStyle as string) || "rounded"
  const themeName = theme || "minimal"

  // Apply theme-specific styles
  const buttonClass =
    buttonStyle === "pill"
      ? "rounded-full"
      : buttonStyle === "square"
      ? "rounded-none"
      : "rounded-md"

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        :root {
          --primary-color: ${primaryColor};
          --heading-font: ${headingFont};
        }
        h1, h2, h3 {
          font-family: var(--heading-font), sans-serif;
        }
      `,
        }}
      />
      <div className="min-h-screen bg-background">
        <StorefrontHeader
          storeSlug={merchant.slug}
          storeName={storeName}
          logoUrl={logoUrl}
        />

        <main className="container mx-auto px-4 py-8">
          {logoUrl && (
            <div className="mb-8 text-center">
              <Image
                src={logoUrl}
                alt={storeTitle}
                width={96}
                height={96}
                className="h-24 w-24 mx-auto rounded-lg object-cover"
              />
            </div>
          )}

          {products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">No products available at the moment.</p>
              <p className="text-sm text-muted-foreground mt-2">Please check back later.</p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2" style={{ color: primaryColor }}>
                  Our Products
                </h2>
                <p className="text-muted-foreground">
                  {products.length} product{products.length !== 1 ? "s" : ""} available
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <Link href={`/s/${merchant.slug}/p/${product.id}`}>
                      {product.images.length > 0 && (
                        <div className="relative w-full h-64">
                          <Image
                            src={product.images[0].url}
                            alt={product.images[0].alt || product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="line-clamp-2">{product.name}</CardTitle>
                        {product.description && (
                          <CardDescription className="line-clamp-2">
                            {product.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold">₹{(product.price / 100).toFixed(2)}</p>
                            {product.mrp && product.mrp > product.price && (
                              <p className="text-sm text-muted-foreground line-through">
                                ₹{(product.mrp / 100).toFixed(2)}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">
                              {product.stock} in stock
                            </p>
                          </div>
                          <Button className={buttonClass} style={{ backgroundColor: primaryColor }}>
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </>
  )
}
