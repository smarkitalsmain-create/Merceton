import { NextRequest, NextResponse } from "next/server"
import { createMerchantWarehouse } from "@/lib/logistics/service"
import { createErrorResponse } from "@/lib/api/error"
import type { LogisticsProviderKey } from "@/lib/logistics/types"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const provider = (body.provider ?? "delhivery") as LogisticsProviderKey

    const result = await createMerchantWarehouse(provider, body)

    return NextResponse.json({ ok: true, warehouse: result })
  } catch (error) {
    return createErrorResponse(error)
  }
}

