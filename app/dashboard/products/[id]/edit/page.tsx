import { notFound } from "next/navigation"
import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ensureTenantAccess } from "@/lib/auth"
import { ProductForm } from "@/components/ProductForm"

export default async function EditProductPage({
  params,
}: {
  params: { id: string }
}) {
  const merchant = await requireMerchant()

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
  })

  if (!product) {
    notFound()
  }

  // Ensure tenant access
  ensureTenantAccess(product.merchantId, merchant.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <p className="text-muted-foreground">Update product details</p>
      </div>
      <ProductForm product={product} />
    </div>
  )
}
