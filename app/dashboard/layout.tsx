import { redirect } from "next/navigation"
import { requireMerchant } from "@/lib/auth"
import { DashboardSidebar } from "@/components/DashboardSidebar"
import { UserButton } from "@clerk/nextjs"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/ErrorBoundary"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This will redirect to onboarding if no merchant
  const merchant = await requireMerchant()

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  )
}
