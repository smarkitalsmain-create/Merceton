import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { StorefrontHeader } from "@/components/StorefrontHeader"
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

  return (
    <div className="min-h-screen bg-background">
      <StorefrontHeader
        storeSlug={merchant.slug}
        storeName={merchant.displayName}
        logoUrl={merchant.storefront?.logoUrl}
      />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        <CheckoutForm storeSlug={params.slug} merchantId={merchant.id} />
      </main>
    </div>
  )
}
