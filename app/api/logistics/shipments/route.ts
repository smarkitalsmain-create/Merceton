import { NextRequest, NextResponse } from "next/server"
import { createOrderShipment } from "@/lib/logistics/service"
import { createErrorResponse } from "@/lib/api/error"
import type { LogisticsProviderKey } from "@/lib/logistics/types"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const provider = (body.provider ?? "delhivery") as LogisticsProviderKey

    const result = await createOrderShipment(provider, body)

    // TODO: persist Shipment entity in DB (shipments table) linking orderId, courierName, awb, trackingUrl

    return NextResponse.json({ ok: true, shipment: result })
  } catch (error) {
    return createErrorResponse(error)
  }
}

