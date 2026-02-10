import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { requireMerchant } from "@/lib/auth"
import { getMerchantOnboarding } from "@/lib/onboarding"
import { DashboardSidebar } from "@/components/DashboardSidebar"
import { UserButton } from "@clerk/nextjs"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { OnboardingGate } from "@/components/OnboardingGate"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get authenticated user
  const { userId } = auth()
  if (!userId) {
    redirect("/sign-in")
  }

  // This will redirect to onboarding/create-store if no merchant
  const merchant = await requireMerchant()

  // Check onboarding status - enforce completion for all dashboard routes except onboarding itself
  const onboarding = await getMerchantOnboarding(merchant.id)

  return (
    <ErrorBoundary>
      <OnboardingGate onboardingStatus={onboarding.onboardingStatus}>
        <div className="min-h-screen bg-background">
          <div className="flex h-screen">
            <DashboardSidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <header className="flex h-16 items-center justify-between border-b px-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    {merchant.displayName}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </header>
              <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
          </div>
          <Toaster />
        </div>
      </OnboardingGate>
    </ErrorBoundary>
  )
}
