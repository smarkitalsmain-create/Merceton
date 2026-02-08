import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { StorefrontHeader } from "@/components/StorefrontHeader"
import { CustomCodeStorefront } from "@/components/CustomCodeStorefront"

export default async function StorePage({
  params,
}: {
  params: { slug: string }
}) {
  // Fetch merchant - read-only, no auth
  const merchant = await prisma.merchant.findUnique({
    where: { slug: params.slug, isActive: true },
    select: {
      id: true,
      slug: true,
      displayName: true,
      isActive: true,
    },
  })

  if (!merchant) {
    notFound()
  }

  // Fetch storefront settings separately - read-only, no upsert
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
    storefront.logoUrl,
    storefront.themeConfig,
    storefront.theme
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
  theme: string | null
) {
  // Safe access to themeConfig with fallbacks
  const config = themeConfig && typeof themeConfig === "object" ? themeConfig : {}
  const storeTitle = merchant.displayName
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
          storeName={storeTitle}
          logoUrl={logoUrl}
        />

        <main className="container mx-auto px-4 py-8">
          {logoUrl && (
            <div className="mb-8 text-center">
              <img
                src={logoUrl}
                alt={storeTitle}
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
