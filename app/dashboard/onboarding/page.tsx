import { requireMerchant } from "@/lib/auth"
import { getOrCreateOnboarding } from "@/lib/services/onboarding.service"
import { redirect } from "next/navigation"
import { OnboardingForm } from "@/components/OnboardingForm"

export default async function OnboardingPage() {
  const merchant = await requireMerchant()
  
  // Get or create onboarding record
  const onboarding = await getOrCreateOnboarding(merchant.id)

  // DEV-only log
  if (process.env.NODE_ENV === "development") {
    console.log("[onboarding page] Onboarding status:", onboarding.onboardingStatus)
    console.log("[onboarding page] Profile completion:", onboarding.profileCompletionPercent)
  }

  // CRITICAL: If already completed, immediately redirect to dashboard
  // This server-side redirect prevents the onboarding form from rendering
  if (onboarding.onboardingStatus === "COMPLETED") {
    if (process.env.NODE_ENV === "development") {
      console.log("[onboarding page] Onboarding already completed, redirecting to /dashboard")
    }
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
