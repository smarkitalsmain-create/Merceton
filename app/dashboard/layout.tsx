import { redirect } from "next/navigation"
import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMerchantOnboarding } from "@/lib/onboarding"
import { DashboardSidebar } from "@/components/DashboardSidebar"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { OnboardingGate } from "@/components/OnboardingGate"
import { createSupabaseServerReadonlyClient } from "@/lib/supabase/server-readonly"
import { DashboardUserMenu } from "@/components/DashboardUserMenu"
import { MerchantStatusBanner } from "@/components/dashboard/MerchantStatusBanner"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Supabase auth: get current user (readonly - no cookie writes)
  const supabase = createSupabaseServerReadonlyClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

  // This will redirect to onboarding/create-store if no merchant
  const merchant = await requireMerchant()

  // Fetch merchant status for banner
  const dbMerchant = await prisma.merchant.findUnique({
    where: { id: merchant.id },
    select: {
      accountStatus: true,
      kycStatus: true,
      holdReasonCode: true,
      holdReasonText: true,
    },
  })

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
                  <DashboardUserMenu />
                </div>
              </header>
              <main className="flex-1 overflow-y-auto p-6">
                {dbMerchant && (
                  <MerchantStatusBanner
                    accountStatus={dbMerchant.accountStatus}
                    kycStatus={dbMerchant.kycStatus}
                    holdReasonCode={dbMerchant.holdReasonCode}
                    holdReasonText={dbMerchant.holdReasonText}
                  />
                )}
                {children}
              </main>
            </div>
          </div>
          <Toaster />
        </div>
      </OnboardingGate>
    </ErrorBoundary>
  )
}
