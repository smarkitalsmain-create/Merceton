export const runtime = "nodejs"

import { requireAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { MerchantPricingAdminForm } from "@/components/admin/MerchantPricingAdminForm"

export default async function MerchantPricingAdminPage({
  params,
}: {
  params: { merchantId: string }
}) {
  await requireAdmin()

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

  const packages = await prisma.pricingPackage.findMany({
    where: {
      deletedAt: null,
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  })

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
    </div>
  )
}
