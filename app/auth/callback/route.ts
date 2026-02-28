import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")

  if (!code) {
    console.warn("[auth/callback] Missing code param, redirecting to /sign-in")
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }

  const supabase = createSupabaseServerClient()

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error("[auth/callback] exchangeCodeForSession error:", exchangeError.message)
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }

  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData?.user) {
    console.error("[auth/callback] getUser error or missing user:", userError?.message)
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }

  const authUserId = userData.user.id
  console.log("[auth/callback] Session established for user:", authUserId)

  let hasMerchant = false

  try {
    const dbUser = await prisma.user.findUnique({
      where: { authUserId },
      include: { merchant: true },
    })

    hasMerchant = !!dbUser?.merchant
    console.log("[auth/callback] DB user:", {
      authUserId,
      dbUserId: dbUser?.id,
      hasMerchant,
    })
  } catch (err) {
    console.error("[auth/callback] Error checking merchant for user:", authUserId, err)
  }

  const targetPath = hasMerchant ? "/dashboard" : "/onboarding/create-store"
  console.log("[auth/callback] Redirecting user", authUserId, "to", targetPath)

  return NextResponse.redirect(new URL(targetPath, req.url))
}
