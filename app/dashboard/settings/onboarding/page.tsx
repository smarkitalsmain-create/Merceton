import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMerchantOnboarding } from "@/lib/onboarding"
import { OnboardingDetailsForm } from "@/components/OnboardingDetailsForm"

export default async function OnboardingSettingsPage() {
  const merchant = await requireMerchant()

  const onboarding = await getMerchantOnboarding(merchant.id)
  const orderCount = await prisma.order.count({
    where: { merchantId: merchant.id },
  })
  const hasOrders = orderCount > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Onboarding Details</h1>
        <p className="text-muted-foreground">
          View and manage your compliance and business information.
        </p>
      </div>
      <OnboardingDetailsForm
        initialOnboarding={{
          onboardingStatus: onboarding.onboardingStatus,
          panType: onboarding.panType,
          panNumber: onboarding.panNumber,
          panName: onboarding.panName,
          panDobOrIncorp: onboarding.panDobOrIncorp
            ? onboarding.panDobOrIncorp.toISOString()
            : null,
          panHolderRole: onboarding.panHolderRole,
          gstStatus: onboarding.gstStatus,
          gstin: onboarding.gstin,
          gstLegalName: onboarding.gstLegalName,
          gstTradeName: onboarding.gstTradeName,
          gstState: onboarding.gstState,
          gstComposition: onboarding.gstComposition,
          gstNotRegisteredReason: onboarding.gstNotRegisteredReason,
          storeDisplayName: onboarding.storeDisplayName,
          legalBusinessName: onboarding.legalBusinessName,
          yearStarted: onboarding.yearStarted,
          businessType: onboarding.businessType,
          primaryCategory: onboarding.primaryCategory,
          secondaryCategory: onboarding.secondaryCategory,
          avgPriceRange: onboarding.avgPriceRange,
          expectedSkuRange: onboarding.expectedSkuRange,
        }}
        hasOrders={hasOrders}
      />
    </div>
  )
}

