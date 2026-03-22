import { NextRequest, NextResponse } from "next/server"
import { getShipmentLabel } from "@/lib/logistics/service"
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
    const providerShipmentId = params.id

    const label = await getShipmentLabel(provider, providerShipmentId)
    const arrayBuffer = label.data.buffer as ArrayBuffer

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": label.contentType,
        "Content-Disposition": `inline; filename=\"label-${label.awb}.pdf\"`,
      },
    })
  } catch (error) {
    return createErrorResponse(error)
  }
}

