import { NextResponse } from "next/server"
import { requireAdminForApi } from "@/lib/admin-auth"
import { getOpsOverview } from "@/lib/admin/ops-overview"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

/** GET /api/admin/ops/overview — operational counts. Protected by admin auth. */
export async function GET() {
  const actor = await requireAdminForApi()
  if (actor instanceof NextResponse) return actor

  try {
    const data = await getOpsOverview()
    return NextResponse.json(data)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load ops overview"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
