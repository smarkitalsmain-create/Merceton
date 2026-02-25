import { NextRequest, NextResponse } from "next/server"
import { requireAdminForApi } from "@/lib/admin-auth"
import { featureFlags } from "@/lib/featureFlags"
import { updateMerchantStatus } from "@/app/actions/merchant-status"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const approveSchema = z.object({
  note: z.string().max(1000).optional().nullable(),
})

export async function POST(
  request: NextRequest,
  context: { params: { merchantId: string } }
) {
  const adminOrResponse = await requireAdminForApi()
  if (adminOrResponse instanceof NextResponse) return adminOrResponse
  const admin = adminOrResponse

  if (!featureFlags.adminMerchantsKyc) {
    return NextResponse.json(
      { ok: false, error: { code: "FEATURE_DISABLED", message: "Feature disabled by configuration" } },
      { status: 503 }
    )
  }

  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID()
  const merchantId = context.params.merchantId

  try {
    let body: unknown = {}
    try {
      const text = await request.text()
      if (text.trim()) body = JSON.parse(text)
    } catch {
      // empty body is ok
    }

    const parsed = approveSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.message,
          },
        },
        { status: 400 }
      )
    }

    const note = parsed.data.note?.trim()
    const reason = note ? `KYC approved via admin: ${note}` : "KYC approved via admin"

    await updateMerchantStatus({
      merchantId,
      kycStatus: "APPROVED",
      reason,
    })

    return NextResponse.json({
      ok: true,
      merchantId,
      kycStatus: "APPROVED",
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("KYC approve error", {
      requestId,
      merchantId,
      adminId: admin.userId,
      error: msg,
    })
    const err = e as { status?: number }
    let status = err.status ?? 500
    if (msg === "Merchant not found") status = 404
    const code =
      status === 401 ? "UNAUTHORIZED" : status === 403 ? "FORBIDDEN" : "INTERNAL_ERROR"
    return NextResponse.json(
      {
        ok: false,
        error: {
          code,
          message: e instanceof Error ? e.message : "Failed to approve KYC",
        },
      },
      { status }
    )
  }
}
