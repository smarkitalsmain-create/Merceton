import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { StorefrontPageBuilder, StorefrontSection } from "@/components/StorefrontPageBuilder"

function getDefaultLayout(displayName: string, slug: string): StorefrontSection[] {
  return [
    {
      id: "hero-1",
      type: "hero",
      settings: {
        headline: `Welcome to ${displayName}`,
        subheadline: "Browse our latest products and offers.",
        ctaText: "Shop Now",
        ctaLink: `/s/${slug}`,
      },
    },
    {
      id: "products-1",
      type: "productGrid",
      settings: {
        title: "Featured Products",
        collection: "featured",
        limit: 8,
      },
    },
    {
      id: "footer-1",
      type: "footer",
      settings: {
        brandName: displayName,
        links: [],
      },
    },
  ]
}

export default async function StorefrontPage() {
  const merchant = await requireMerchant()

  const page = await prisma.storefrontPage.upsert({
    where: {
      merchantId_slug: {
        merchantId: merchant.id,
        slug: "home",
      },
    },
    update: {},
    create: {
      merchantId: merchant.id,
      slug: "home",
      title: `${merchant.displayName} Home`,
      layoutJson: { sections: getDefaultLayout(merchant.displayName, merchant.slug) } as any,
      isPublished: true,
      publishedAt: new Date(),
    },
    select: {
      title: true,
      isPublished: true,
      layoutJson: true,
    },
  })

  const sections = Array.isArray((page.layoutJson as any)?.sections)
    ? ((page.layoutJson as any).sections as StorefrontSection[])
    : getDefaultLayout(merchant.displayName, merchant.slug)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Storefront Builder</h1>
          <p className="text-muted-foreground">
            Add and customize sections for your home page
          </p>
        </div>
      </div>

      <StorefrontPageBuilder
        merchantSlug={merchant.slug}
        initialTitle={page.title}
        initialIsPublished={page.isPublished}
        initialLayout={sections}
      />
    </div>
  )
}
