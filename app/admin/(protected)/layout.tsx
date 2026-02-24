import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/AdminSidebar"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { AccessDenied } from "@/components/admin/AccessDenied"
import { createSupabaseServerReadonlyClient } from "@/lib/supabase/server-readonly"
import { isEmailInAllowlist, isAllowlistConfigured } from "@/lib/admin-allowlist"

/**
 * Protected admin layout - enforces authentication and allowlist.
 * Only routes under (protected) are guarded by this layout.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check authentication
  const supabase = createSupabaseServerReadonlyClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If not logged in, redirect to sign-in
  if (!user) {
    redirect("/admin/sign-in?redirect=/admin")
  }

  // Check if allowlist is configured
  const allowlistConfigured = isAllowlistConfigured()

  // Check if user is in allowlist
  const isSuperAdmin = isEmailInAllowlist(user.email)

  // If not in allowlist, show access denied
  if (!isSuperAdmin) {
    return <AccessDenied allowlistConfigured={allowlistConfigured} />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <AdminSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminHeader email={user.email ?? ""} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
