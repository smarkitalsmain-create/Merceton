import { NextRequest, NextResponse } from "next/server"
import { getServiceability } from "@/lib/logistics/service"
import { validatePincode } from "@/lib/logistics/validators"
import { createErrorResponse } from "@/lib/api/error"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const pincode = url.searchParams.get("pincode")
  const provider = (url.searchParams.get("provider") || "delhivery") as any

  try {
    if (!pincode) {
      return NextResponse.json(
        { error: "pincode is required" },
        { status: 400 }
      )
    }

    const normalizedPincode = validatePincode(pincode)

    const result = await getServiceability(provider, {
      pincode: normalizedPincode,
    })

    return NextResponse.json({ ok: true, result })
  } catch (error) {
    return createErrorResponse(error)
  }
}

