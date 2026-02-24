import { requireMerchant } from "@/lib/auth"
import { getMerchantOnboarding } from "@/lib/onboarding"
import { redirect } from "next/navigation"
import { OnboardingForm } from "@/components/OnboardingForm"

export default async function OnboardingPage() {
  const merchant = await requireMerchant()
  const onboarding = await getMerchantOnboarding(merchant.id)

  // If already completed, redirect to dashboard
  if (onboarding.onboardingStatus === "COMPLETED") {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
          <p className="text-muted-foreground">
            We need a few details to set up your store. This will only take a few minutes.
          </p>
        </div>
        <OnboardingForm initialData={onboarding} />
      </div>
    </div>
  )
}
