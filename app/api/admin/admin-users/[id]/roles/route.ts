import { NextResponse } from "next/server"
import { requireAdminForApi } from "@/lib/admin-auth"
import { featureFlags } from "@/lib/featureFlags"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  context: { params: { id: string } }
) {
  const actor = await requireAdminForApi()
  if (actor instanceof NextResponse) return actor
  if (!featureFlags.adminAdminUsers) {
    return NextResponse.json(
      { error: "Feature disabled by configuration" },
      { status: 503 }
    )
  }
  return NextResponse.json({ roles: [] })
}

export async function PUT(
  _request: Request,
  context: { params: { id: string } }
) {
  const actor = await requireAdminForApi()
  if (actor instanceof NextResponse) return actor
  if (!featureFlags.adminAdminUsers) {
    return NextResponse.json(
      { error: "Feature disabled by configuration" },
      { status: 503 }
    )
  }
  return NextResponse.json(
    { error: "Admin user role management is not configured" },
    { status: 503 }
  )
}
