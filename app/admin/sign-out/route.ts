import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  
  await supabase.auth.signOut()

  return NextResponse.redirect(new URL("/admin/sign-in", req.url))
}
