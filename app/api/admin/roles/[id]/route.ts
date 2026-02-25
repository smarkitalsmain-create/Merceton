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
  if (!featureFlags.adminRoles) {
    return NextResponse.json(
      { error: "Feature disabled by configuration" },
      { status: 503 }
    )
  }
  return NextResponse.json({ error: "Role not found" }, { status: 404 })
}

export async function PATCH(
  _request: Request,
  context: { params: { id: string } }
) {
  const actor = await requireAdminForApi()
  if (actor instanceof NextResponse) return actor
  if (!featureFlags.adminRoles) {
    return NextResponse.json(
      { error: "Feature disabled by configuration" },
      { status: 503 }
    )
  }
  return NextResponse.json(
    { error: "Role management is not configured" },
    { status: 503 }
  )
}

export async function DELETE(
  _request: Request,
  context: { params: { id: string } }
) {
  const actor = await requireAdminForApi()
  if (actor instanceof NextResponse) return actor
  if (!featureFlags.adminRoles) {
    return NextResponse.json(
      { error: "Feature disabled by configuration" },
      { status: 503 }
    )
  }
  return NextResponse.json(
    { error: "Role management is not configured" },
    { status: 503 }
  )
}
