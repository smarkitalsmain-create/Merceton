export const runtime = "nodejs"

import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { StorefrontHeader } from "@/components/StorefrontHeader"
import { MaintenanceMode } from "@/components/MaintenanceMode"
import type { Metadata } from "next"
import { StorefrontBuyBox } from "@/components/storefront/StorefrontBuyBox"

export async function generateMetadata({
  params,
}: {
  params: { slug: string; productId: string }
}): Promise<Metadata> {
  const merchant = await prisma.merchant.findUnique({
    where: { slug: params.slug, isActive: true },
    select: { id: true, displayName: true },
  })

  if (!merchant) {
    return {}
  }

  const product = await prisma.product.findFirst({
    where: { id: params.productId, merchantId: merchant.id, isActive: true },
    select: {
      name: true,
      description: true,
      images: { take: 1, orderBy: { sortOrder: "asc" } },
    },
  })

  if (!product) {
    return {}
  }

  const og = product.images[0]?.url

  return {
    title: `${product.name} · ${merchant.displayName}`,
    description: product.description?.slice(0, 160) ?? undefined,
    openGraph: og ? { images: [{ url: og }] } : undefined,
  }
}

export default async function StorefrontProductPage({
  params,
}: {
  params: { slug: string; productId: string }
}) {
  const merchant = await prisma.merchant.findUnique({
    where: { slug: params.slug, isActive: true },
    select: {
      id: true,
      slug: true,
      displayName: true,
      accountStatus: true,
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

  const storefront = await prisma.storefrontSettings.findUnique({
    where: { merchantId: merchant.id },
    select: { logoUrl: true },
  })

  const product = await prisma.product.findFirst({
    where: {
      id: params.productId,
      merchantId: merchant.id,
      isActive: true,
    },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
  })

  if (!product) {
    notFound()
  }

  const logoUrl = storeSettings?.logoUrl || storefront?.logoUrl || null
  const storeName = storeSettings?.storeName || merchant.displayName

  return (
    <div className="min-h-screen bg-background">
      <StorefrontHeader storeSlug={merchant.slug} storeName={storeName} logoUrl={logoUrl} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href={`/s/${merchant.slug}`}
          className="text-sm text-muted-foreground hover:underline mb-6 inline-block"
        >
          ← Back to store
        </Link>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            {product.images.length > 0 ? (
              <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted">
                <Image
                  src={product.images[0].url}
                  alt={product.images[0].alt || product.name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div className="flex aspect-square w-full items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                No image
              </div>
            )}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1).map((img) => (
                  <div key={img.id} className="relative aspect-square overflow-hidden rounded-md border">
                    <Image
                      src={img.url}
                      alt={img.alt || product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 25vw, 12vw"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="text-3xl font-bold">₹{(product.price / 100).toFixed(2)}</p>
              {product.mrp != null && product.mrp > product.price && (
                <p className="text-lg text-muted-foreground line-through">
                  ₹{(product.mrp / 100).toFixed(2)}
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </p>
            {product.description && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-muted-foreground">{product.description}</p>
              </div>
            )}
            <StorefrontBuyBox
              storeSlug={merchant.slug}
              productId={product.id}
              productName={product.name}
              pricePaise={product.price}
              imageUrl={product.images[0]?.url ?? null}
              inStock={product.stock > 0}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
