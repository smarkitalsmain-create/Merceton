import { notFound } from "next/navigation"
import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ensureTenantAccess } from "@/lib/auth"
import { getMerchantOnboarding } from "@/lib/onboarding"
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

  const onboarding = await getMerchantOnboarding(merchant.id)
  const isGstRegistered = onboarding.gstStatus === "REGISTERED"

  if (process.env.NODE_ENV !== "production") {
    // Debug log: confirm onboarding GST status for this merchant on edit page
    console.log("EditProductPage GST status", {
      merchantId: merchant.id,
      gstStatus: onboarding.gstStatus,
      isGstRegistered,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <p className="text-muted-foreground">Update product details</p>
        {process.env.NODE_ENV !== "production" && (
          <p className="text-xs text-muted-foreground mt-1">
            GST Registered (debug): {String(isGstRegistered)}
          </p>
        )}
      </div>
      <ProductForm product={product} isGstRegistered={isGstRegistered} />
    </div>
  )
}
