import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const next = url.searchParams.get("next") || "/dashboard"

  if (!code) {
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }

  const supabase = createSupabaseServerClient()

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("Supabase app auth callback error:", error)
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }

  return NextResponse.redirect(new URL(next, req.url))
}
