export const runtime = "nodejs"

import { AdminSidebar } from "@/components/AdminSidebar"
import { AdminHeader } from "@/components/admin/AdminHeader"
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
            <AdminHeader email={actor.email} />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
        <Toaster />
      </div>
    </ErrorBoundary>
  )
}
