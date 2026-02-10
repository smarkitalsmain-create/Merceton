export const runtime = "nodejs"

import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/AdminSidebar"
import { UserButton } from "@clerk/nextjs"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { requireSuperAdmin } from "@/lib/admin-auth"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Protect admin routes - redirects if not super admin
  const actor = await requireSuperAdmin()

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <div className="flex h-screen">
          <AdminSidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <header className="flex h-16 items-center justify-between border-b px-6">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-muted-foreground">
                  {actor.email} (Super Admin)
                </span>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href="/dashboard"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Go to Merchant Dashboard →
                </a>
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
