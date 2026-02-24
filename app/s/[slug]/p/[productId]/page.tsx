import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { StorefrontHeader } from "@/components/StorefrontHeader"
import { MaintenanceMode } from "@/components/MaintenanceMode"
import { AddToCartButton } from "@/components/AddToCartButton"

export default async function ProductPage({
  params,
}: {
  params: { slug: string; productId: string }
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

  const product = await prisma.product.findFirst({
    where: {
      id: params.productId,
      merchantId: merchant.id,
      isActive: true,
    },
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
  })

  if (!product) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <StorefrontHeader
        storeSlug={merchant.slug}
        storeName={storeName}
        logoUrl={logoUrl}
      />

      <main className="container mx-auto px-4 py-8">
        <Link
          href={`/s/${params.slug}`}
          className="text-sm text-muted-foreground hover:underline mb-6 inline-block"
        >
          ← Back to store
        </Link>

        <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
          {product.images.length > 0 && (
            <div className="space-y-4">
              <div className="relative w-full aspect-square">
                <Image
                  src={product.images[0].url}
                  alt={product.images[0].alt || product.name}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.slice(1, 5).map((image, idx) => (
                    <div key={idx} className="relative aspect-square">
                      <Image
                        src={image.url}
                        alt={image.alt || product.name}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">{product.name}</CardTitle>
              {product.description && (
                <CardDescription className="text-base mt-2">
                  {product.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-baseline gap-3">
                  <p className="text-4xl font-bold">₹{(product.price / 100).toFixed(2)}</p>
                  {product.mrp && product.mrp > product.price && (
                    <p className="text-xl text-muted-foreground line-through">
                      ₹{(product.mrp / 100).toFixed(2)}
                    </p>
                  )}
                </div>
                {product.stock > 0 ? (
                  <p className="text-sm text-muted-foreground mt-2">
                    {product.stock} in stock
                  </p>
                ) : (
                  <p className="text-sm text-destructive mt-2">Out of stock</p>
                )}
                {product.sku && (
                  <p className="text-xs text-muted-foreground mt-1">SKU: {product.sku}</p>
                )}
              </div>

              {product.stock > 0 ? (
                <AddToCartButton
                  product={{
                    id: product.id,
                    name: product.name,
                    price: product.price / 100,
                    imageUrl: product.images[0]?.url,
                  }}
                  storeSlug={params.slug}
                  maxQuantity={product.stock}
                />
              ) : (
                <Button disabled className="w-full">Out of Stock</Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
