import { NextRequest, NextResponse } from "next/server"
import { updateMerchantWarehouse } from "@/lib/logistics/service"
import { createErrorResponse } from "@/lib/api/error"
import type { LogisticsProviderKey } from "@/lib/logistics/types"

export const runtime = "nodejs"

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const provider = (body.provider ?? "delhivery") as LogisticsProviderKey
    const providerWarehouseId = params.id

    const result = await updateMerchantWarehouse(provider, providerWarehouseId, body)

    return NextResponse.json({ ok: true, warehouse: result })
  } catch (error) {
    return createErrorResponse(error)
  }
}

