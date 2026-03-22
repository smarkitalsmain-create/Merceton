import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

/**
 * Only allow same-origin relative paths (open-redirect safe).
 */
function getSafeNextPath(raw: string | null): string | null {
  if (raw == null) return null
  const next = raw.trim()
  if (!next.startsWith("/")) return null
  if (next.startsWith("//")) return null
  if (next.includes("://")) return null
  if (next.includes("\\")) return null
  return next
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const nextRaw = url.searchParams.get("next")

  if (!code) {
    return NextResponse.redirect(new URL("/sign-in", url.origin))
  }

  const supabase = createSupabaseServerClient()

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession:", error.message)
    return NextResponse.redirect(new URL("/sign-in", url.origin))
  }

  const safeNext = getSafeNextPath(nextRaw)
  if (safeNext) {
    return NextResponse.redirect(new URL(safeNext, url.origin))
  }

  // Default: app home. Configure Supabase "Redirect URLs" / email templates to pass
  // ?next=/onboarding/create-store for first-time merchant onboarding if needed.
  return NextResponse.redirect(new URL("/dashboard", url.origin))
}
