import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Supabase Admin] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set"
  )
}

/**
 * Admin Supabase browser client with isolated session storage.
 * Uses separate storage key to keep admin sessions independent from app sessions.
 */
export function createSupabaseAdminBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: "sb-admin-auth",
    },
  })
}
