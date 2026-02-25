export const runtime = "nodejs"

import { requireSuperAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { getMerchantResolvedFeatures } from "@/app/actions/features"
import { MerchantPricingAdminForm } from "@/components/admin/MerchantPricingAdminForm"
import { MerchantFeatureOverrideEditor } from "@/components/admin/MerchantFeatureOverrideEditor"

export default async function MerchantPricingAdminPage({
  params,
}: {
  params: { merchantId: string }
}) {
  await requireSuperAdmin()

  const merchant = await prisma.merchant.findUnique({
    where: { id: params.merchantId },
    include: {
      feeConfig: {
        include: {
          pricingPackage: true,
        },
      },
    },
  })

  if (!merchant) {
    notFound()
  }

  const [packages, resolvedFeatures] = await Promise.all([
    prisma.pricingPackage.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    getMerchantResolvedFeatures(merchant.id),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Merchant Pricing: {merchant.displayName}</h1>
        <p className="text-muted-foreground">Assign package and configure fee overrides</p>
      </div>

      <MerchantPricingAdminForm
        merchant={merchant}
        feeConfig={merchant.feeConfig}
        packages={packages}
      />

      <MerchantFeatureOverrideEditor
        merchantId={merchant.id}
        resolvedFeatures={resolvedFeatures}
      />
    </div>
  )
}
