import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { StorefrontBuilder } from "@/components/storefront/builder/StorefrontBuilder"
import { getDraftStorefrontConfig } from "@/lib/storefront/core/config/getConfig"

export default async function StorefrontPage() {
  const merchant = await requireMerchant()

  // Get or create page
  const page = await prisma.storefrontPage.findUnique({
    where: {
      merchantId_slug: {
        merchantId: merchant.id,
        slug: "home",
      },
    },
  })

  // Get draft config (for builder) - always returns a config (normalized)
  const config = await getDraftStorefrontConfig(merchant.id)

  const isPublished = page?.isPublished || false

  return (
    <StorefrontBuilder
      merchantSlug={merchant.slug}
      merchantId={merchant.id}
      initialConfig={config}
      initialIsPublished={isPublished}
    />
  )
}
