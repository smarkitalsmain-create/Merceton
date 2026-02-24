import { createSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { isEmailInAllowlist } from "@/lib/admin-allowlist"

/**
 * Check if the current user is an admin (platform owner)
 * Based on email allowlist in environment variable
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return false
  }

  // Get user email from database
  const { prisma } = await import("@/lib/prisma")
  const dbUser = await prisma.user.findUnique({
    where: { authUserId: user.id },
    select: { email: true },
  })

  if (!dbUser) {
    return false
  }

  return isEmailInAllowlist(dbUser.email)
}

/**
 * Require admin access - redirects to home if not admin
 */
export async function requireAdmin() {
  const isAdminUser = await isAdmin()
  if (!isAdminUser) {
    redirect("/")
  }
  return true
}
