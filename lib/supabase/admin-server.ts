import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Supabase Admin] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set"
  )
}

/**
 * Mutable Admin Supabase server client that CAN write cookies.
 * Uses cookie path "/_admin" to keep admin sessions separate from app sessions.
 * 
 * IMPORTANT: Only use this in:
 * - middleware.ts (for session refresh)
 * - Route handlers (app/api routes)
 * - Auth callback handlers (app/_admin/auth/callback/route.ts)
 * 
 * DO NOT use this in:
 * - Server Components (app/_admin page.tsx files) - use admin-server-readonly.ts instead
 * - Layouts (app/_admin layout.tsx files) - use admin-server-readonly.ts instead
 */
export function createSupabaseAdminServerClient() {
  const cookieStore = cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        // Set with admin-specific path to isolate cookies
        cookieStore.set({
          name,
          value,
          ...options,
          path: "/_admin",
        })
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({
          name,
          value: "",
          ...options,
          path: "/_admin",
        })
      },
    },
  })
}
