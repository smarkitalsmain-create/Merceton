import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { StorefrontHeader } from "@/components/StorefrontHeader"
import { MaintenanceMode } from "@/components/MaintenanceMode"
import { CheckoutForm } from "@/components/CheckoutForm"

export default async function CheckoutPage({
  params,
}: {
  params: { slug: string }
}) {
  const merchant = await prisma.merchant.findUnique({
    where: { slug: params.slug, isActive: true },
    include: {
      storefront: true,
    },
  })

  if (!merchant) {
    notFound()
  }

  // Check if store is live
  const storeSettings = await prisma.merchantStoreSettings.findUnique({
    where: { merchantId: merchant.id },
    select: {
      isStoreLive: true,
      storeName: true,
      logoUrl: true,
    },
  })

  const isStoreLive = storeSettings?.isStoreLive ?? true
  if (!isStoreLive || merchant.accountStatus === "ON_HOLD") {
    return <MaintenanceMode storeName={storeSettings?.storeName || merchant.displayName} />
  }

  const logoUrl = storeSettings?.logoUrl || merchant.storefront?.logoUrl || null
  const storeName = storeSettings?.storeName || merchant.displayName

  return (
    <div className="min-h-screen bg-background">
      <StorefrontHeader
        storeSlug={merchant.slug}
        storeName={storeName}
        logoUrl={logoUrl}
      />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        <CheckoutForm storeSlug={params.slug} merchantId={merchant.id} />
      </main>
    </div>
  )
}
