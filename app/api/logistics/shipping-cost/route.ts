import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { calculateShippingCost } from "@/lib/logistics/service"
import { createErrorResponse } from "@/lib/api/error"
import type { LogisticsProviderKey, Pincode } from "@/lib/logistics/types"
import { PincodeSchema } from "@/lib/logistics/types"
import { validatePincode } from "@/lib/logistics/validators"

export const runtime = "nodejs"

const ShippingCostRouteBodySchema = z.object({
  provider: z.string().optional(),
  merchantId: z.string().min(1),
  destinationPincode: PincodeSchema,
  paymentMethod: z.enum(["COD", "UPI", "RAZORPAY"]).optional(),
  // Optional override; checkout currently doesn't collect weight.
  weightGrams: z.number().positive().optional(),
  codAmount: z.number().nonnegative().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = ShippingCostRouteBodySchema.parse(await req.json())
    const provider = (body.provider ?? "delhivery") as LogisticsProviderKey

    // Origin pincode is merchant/store specific.
    const storeSettings = await prisma.merchantStoreSettings.findUnique({
      where: { merchantId: body.merchantId },
      select: { pincode: true },
    })

    let originPincodeRaw = storeSettings?.pincode ?? ""
    let originPincode: Pincode
    try {
      originPincode = validatePincode(originPincodeRaw)
    } catch {
      // TODO: wire real origin pincode/warehouse per merchant if/when available.
      // Temporary safe fallback to keep checkout functional.
      originPincode = validatePincode("110001")
    }

    const paymentMode = body.paymentMethod === "COD" ? "cod" : "prepaid"

    const result = await calculateShippingCost(provider, {
      originPincode,
      destinationPincode: body.destinationPincode,
      weightGrams: body.weightGrams ?? 1000,
      paymentMode,
      codAmount: paymentMode === "cod" ? body.codAmount : undefined,
      merchantId: body.merchantId,
    })

    if (process.env.NODE_ENV === "development") {
      console.error("[serviceability:shipping-cost:api]", {
        merchantId: body.merchantId,
        destinationPincode: body.destinationPincode,
        originPincode,
        result,
      })
    }

    return NextResponse.json({ ok: true, result })
  } catch (error) {
    return createErrorResponse(error)
  }
}

