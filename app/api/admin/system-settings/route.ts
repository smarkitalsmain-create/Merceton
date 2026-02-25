import { NextResponse } from "next/server"
import { requireAdminForApi } from "@/lib/admin-auth"
import { featureFlags } from "@/lib/featureFlags"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const defaultSettings = {
  id: "system",
  maintenanceMode: false,
  maintenanceBanner: null as string | null,
  supportEmail: null as string | null,
  supportPhone: null as string | null,
  enableCustomDomains: true,
  enablePayouts: true,
  enablePlatformInvoices: true,
}

export async function GET() {
  const actor = await requireAdminForApi()
  if (actor instanceof NextResponse) return actor
  if (!featureFlags.adminSystemSettings) {
    return NextResponse.json(
      { error: "Feature disabled by configuration" },
      { status: 503 }
    )
  }
  return NextResponse.json(defaultSettings)
}

export async function POST() {
  const actor = await requireAdminForApi()
  if (actor instanceof NextResponse) return actor
  if (!featureFlags.adminSystemSettings) {
    return NextResponse.json(
      { error: "Feature disabled by configuration" },
      { status: 503 }
    )
  }
  return NextResponse.json(
    { error: "System settings persistence is not configured" },
    { status: 503 }
  )
}
