export const runtime = "nodejs"

import { requireSuperAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { getEffectiveFeeConfig } from "@/lib/pricing"
import { notFound } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MerchantSummaryTab } from "@/components/admin/MerchantSummaryTab"
import { MerchantOrdersTab } from "@/components/admin/MerchantOrdersTab"
import { MerchantPricingTab } from "@/components/admin/MerchantPricingTab"
import { MerchantAuditTab } from "@/components/admin/MerchantAuditTab"

export default async function MerchantDetailPage({
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
      _count: {
        select: {
          orders: true,
          products: true,
          payments: true,
        },
      },
    },
  })

  if (!merchant) {
    notFound()
  }

  // Get effective pricing config, assignable packages, recent orders, and GMV
  const [effectiveConfig, packages, recentOrders, gmvResult] = await Promise.all([
    getEffectiveFeeConfig(merchant.id),
    prisma.pricingPackage.findMany({
      where: {
        deletedAt: null,
        status: "PUBLISHED",
        isActive: true,
        visibility: { in: ["PUBLIC", "INTERNAL"] },
      },
      select: {
        id: true,
        name: true,
        fixedFeePaise: true,
        variableFeeBps: true,
        payoutFrequency: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.findMany({
      where: { merchantId: merchant.id },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        payment: {
          select: {
            status: true,
            amount: true,
          },
        },
      },
    }),
    prisma.order.aggregate({
      where: { merchantId: merchant.id },
      _sum: { grossAmount: true },
    }),
  ])
  const gmv = gmvResult._sum.grossAmount?.toNumber() || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{merchant.displayName}</h1>
        <p className="text-muted-foreground">Merchant details and management</p>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="pricing">Pricing & Risk</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <MerchantSummaryTab
            merchant={merchant}
            stats={{
              orders: merchant._count.orders,
              products: merchant._count.products,
              payments: merchant._count.payments,
              gmv,
            }}
          />
        </TabsContent>

        <TabsContent value="orders">
          <MerchantOrdersTab orders={recentOrders} />
        </TabsContent>

        <TabsContent value="pricing">
          <MerchantPricingTab
            merchant={{ id: merchant.id, displayName: merchant.displayName }}
            feeConfig={merchant.feeConfig}
            effectiveConfig={{
              fixedFeePaise: effectiveConfig.fixedFeePaise,
              variableFeeBps: effectiveConfig.variableFeeBps,
              payoutFrequency: effectiveConfig.payoutFrequency,
              packageId: effectiveConfig.packageId,
              packageName: effectiveConfig.packageName,
            }}
            packages={packages}
          />
        </TabsContent>

        <TabsContent value="audit">
          <MerchantAuditTab merchantId={merchant.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
