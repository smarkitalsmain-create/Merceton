import { NextRequest, NextResponse } from "next/server"
import { getShipmentTracking } from "@/lib/logistics/service"
import { createErrorResponse } from "@/lib/api/error"
import type { LogisticsProviderKey } from "@/lib/logistics/types"

export const runtime = "nodejs"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(req.url)
    const provider = (url.searchParams.get("provider") ?? "delhivery") as LogisticsProviderKey
    const awb = params.id

    const tracking = await getShipmentTracking(provider, awb)

    return NextResponse.json({ ok: true, tracking })
  } catch (error) {
    return createErrorResponse(error)
  }
}

