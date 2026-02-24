import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdminServerClient } from "@/lib/supabase/admin-server"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const next = url.searchParams.get("next") || "/_admin"

  if (!code) {
    return NextResponse.redirect(new URL("/_admin/sign-in", req.url))
  }

  const supabase = createSupabaseAdminServerClient()

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("Supabase admin auth callback error:", error)
    return NextResponse.redirect(new URL("/_admin/sign-in", req.url))
  }

  return NextResponse.redirect(new URL(next, req.url))
}
