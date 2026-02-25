import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdminForApi } from "@/lib/admin-auth"
import { featureFlags } from "@/lib/featureFlags"
import { HOLD_REASON_CODES, requiresNotes } from "@/lib/merchant/holdReasons"
import { updateMerchantStatus } from "@/app/actions/merchant-status"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const holdSchema = z.object({
  reasonCode: z.enum(HOLD_REASON_CODES as unknown as [string, ...string[]]),
  reasonText: z.string().max(1000).optional().nullable(),
})

export async function POST(
  request: NextRequest,
  context: { params: { merchantId: string } }
) {
  const adminOrResponse = await requireAdminForApi()
  if (adminOrResponse instanceof NextResponse) return adminOrResponse
  const admin = adminOrResponse

  if (!featureFlags.adminMerchantsHoldRelease) {
    return NextResponse.json(
      { ok: false, error: { code: "FEATURE_DISABLED", message: "Feature disabled by configuration" } },
      { status: 503 }
    )
  }

  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID()
  const merchantId = context.params.merchantId

  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Invalid JSON body" } },
        { status: 400 }
      )
    }

    const parsed = holdSchema.safeParse(body)
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

    const { reasonCode, reasonText } = parsed.data
    if (requiresNotes(reasonCode) && !reasonText?.trim()) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "NOTES_REQUIRED",
            message: "Notes are required for this reason",
          },
        },
        { status: 400 }
      )
    }

    const result = await updateMerchantStatus({
      merchantId,
      accountStatus: "ON_HOLD",
      holdReasonCode: reasonCode,
      holdReasonText: reasonText?.trim() || null,
      reason: `Put on hold via admin API (${reasonCode})`,
    })

    return NextResponse.json({
      ok: true,
      merchantId,
      newStatus: "ON_HOLD",
      holdReasonCode: reasonCode,
      holdReasonText: reasonText?.trim() || null,
      emailsSent: result.emailsSent,
    })
  } catch (e: any) {
    console.error("Hold merchant error", {
      requestId,
      merchantId,
      adminId: admin.userId,
      error: e?.message,
      code: e?.code,
    })
    const status = (e as any).status ?? 500
    const code =
      status === 401 ? "UNAUTHORIZED" : status === 403 ? "FORBIDDEN" : "INTERNAL_ERROR"
    return NextResponse.json(
      {
        ok: false,
        error: {
          code,
          message: e instanceof Error ? e.message : "Failed to put merchant on hold",
        },
      },
      { status }
    )
  }
}
