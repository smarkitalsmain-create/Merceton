import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GrapesJSEditor } from "@/components/GrapesJSEditor"

export default async function StorefrontPage() {
  const { merchant } = await requireAdmin()

  // Load or create storefront settings
  const storefront = await prisma.storefrontSettings.upsert({
    where: { merchantId: merchant.id },
    update: {},
    create: {
      merchantId: merchant.id,
      mode: "THEME",
    },
    select: {
      id: true,
      builderJson: true,
      builderHtml: true,
      builderCss: true,
    },
  })

  return (
    <GrapesJSEditor
      merchantId={merchant.id}
      merchantSlug={merchant.slug}
      initialData={{
        builderJson: storefront.builderJson ?? null,
        builderHtml: storefront.builderHtml,
        builderCss: storefront.builderCss,
      }}
    />
  )
}
