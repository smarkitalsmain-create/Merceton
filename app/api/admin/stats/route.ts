import { NextResponse } from "next/server"
import { requireAdminForApi } from "@/lib/admin-auth"
import { getAdminStats } from "@/lib/admin/stats"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

/** GET /api/admin/stats — platform KPIs. Protected by admin auth. */
export async function GET() {
  const actor = await requireAdminForApi()
  if (actor instanceof NextResponse) return actor

  try {
    const stats = await getAdminStats()
    return NextResponse.json(stats)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load stats"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
