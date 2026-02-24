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
import { MerchantOnboardingTab } from "@/components/admin/MerchantOnboardingTab"
import { MerchantStatusEditor } from "@/components/admin/MerchantStatusEditor"

export default async function MerchantDetailPage({
  params,
}: {
  params: { merchantId: string }
}) {
  await requireSuperAdmin()

  const merchant = await prisma.merchant.findUnique({
    where: { id: params.merchantId },
    select: {
      id: true,
      slug: true,
      displayName: true,
      isActive: true,
      accountStatus: true,
      kycStatus: true,
      holdReasonCode: true,
      holdReasonText: true,
      holdAppliedAt: true,
      kycApprovedAt: true,
      createdAt: true,
      customDomain: true,
      domainStatus: true,
      feeConfig: {
        include: {
          pricingPackage: true,
        },
      },
      onboarding: true,
      bankAccount: {
        select: {
          accountHolderName: true,
          bankName: true,
          accountNumber: true,
          ifscCode: true,
          accountType: true,
          verificationStatus: true,
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
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="pricing">Pricing & Risk</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <MerchantSummaryTab
            merchant={{
              id: merchant.id,
              displayName: merchant.displayName,
              slug: merchant.slug,
              isActive: merchant.isActive,
              accountStatus: merchant.accountStatus,
              kycStatus: merchant.kycStatus,
              holdReasonCode: merchant.holdReasonCode,
              holdReasonText: merchant.holdReasonText,
              holdAppliedAt: merchant.holdAppliedAt,
              kycApprovedAt: merchant.kycApprovedAt,
              createdAt: merchant.createdAt,
              customDomain: merchant.customDomain,
              domainStatus: merchant.domainStatus,
            }}
            stats={{
              orders: merchant._count.orders,
              products: merchant._count.products,
              payments: merchant._count.payments,
              gmv,
            }}
          />
        </TabsContent>

        <TabsContent value="status">
          <MerchantStatusEditor
            merchantId={merchant.id}
            currentAccountStatus={merchant.accountStatus}
            currentKycStatus={merchant.kycStatus}
            currentHoldReasonCode={merchant.holdReasonCode}
            currentHoldReasonText={merchant.holdReasonText}
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

        <TabsContent value="onboarding">
          <MerchantOnboardingTab
            merchantId={merchant.id}
            onboarding={merchant.onboarding ? {
              ...merchant.onboarding,
              // Map invoice* fields to contact* for component compatibility
              contactEmail: merchant.onboarding.invoiceEmail,
              contactPhone: merchant.onboarding.invoicePhone,
              websiteUrl: null, // Field doesn't exist in schema
              contactAddressLine1: merchant.onboarding.invoiceAddressLine1,
              contactAddressLine2: merchant.onboarding.invoiceAddressLine2,
              contactCity: merchant.onboarding.invoiceCity,
              contactState: merchant.onboarding.invoiceState,
              contactPincode: merchant.onboarding.invoicePincode,
            } as any : null}
            bankAccount={merchant.bankAccount}
          />
        </TabsContent>

        <TabsContent value="audit">
          <MerchantAuditTab merchantId={merchant.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
