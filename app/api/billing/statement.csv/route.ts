import { NextRequest, NextResponse } from "next/server"
import { requireAdminForApi } from "@/lib/admin-auth"
import { requireMerchant } from "@/lib/auth"
import { featureFlags } from "@/lib/featureFlags"
import { getPlatformBillingProfile } from "@/lib/billing/queries"
import { aggregateLedgerEntriesForInvoice } from "@/lib/billing/aggregate"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

function getStateCode(state: string | null | undefined): string {
  if (!state) return "09"
  if (/^\d{2}$/.test(state)) return state
  const match = state.match(/\d{2}/)
  return match ? match[0] : "09"
}

/**
 * GET /api/billing/statement.csv
 * - With merchantId (admin): requires admin auth, returns that merchant's statement CSV.
 * - Without merchantId: requires merchant session, returns own statement CSV.
 * Query: from (YYYY-MM-DD), to (YYYY-MM-DD), optional merchantId (admin only).
 */
export async function GET(request: NextRequest) {
  if (!featureFlags.billingStatement) {
    return NextResponse.json(
      { error: "Feature disabled by configuration" },
      { status: 503 }
    )
  }

  const { searchParams } = new URL(request.url)
  const merchantIdParam = searchParams.get("merchantId")?.trim()
  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")

  let merchantId: string
  if (merchantIdParam) {
    const adminOrRes = await requireAdminForApi()
    if (adminOrRes instanceof NextResponse) return adminOrRes
    merchantId = merchantIdParam
  } else {
    try {
      const merchant = await requireMerchant()
      merchantId = merchant.id
    } catch {
      return NextResponse.json(
        { error: "Unauthorized. Sign in or provide admin merchantId." },
        { status: 401 }
      )
    }
  }

  const fromStr =
    fromParam ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  const toStr = toParam ?? new Date().toISOString().slice(0, 10)
  const from = new Date(fromStr)
  const to = new Date(toStr)
  if (isNaN(from.getTime()) || isNaN(to.getTime()) || from > to) {
    return NextResponse.json(
      { error: "Invalid from or to date. Use YYYY-MM-DD." },
      { status: 400 }
    )
  }

  try {
    const [profile, merchant] = await Promise.all([
      getPlatformBillingProfile(),
      prisma.merchant.findUnique({
        where: { id: merchantId },
        include: { onboarding: true },
      }),
    ])
    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 })
    }

    const gstRate = Number(profile.defaultGstRate) || 18
    const supplierStateCode = getStateCode(profile.state)
    const recipientState =
      merchant.onboarding?.gstState ?? merchant.onboarding?.invoiceState ?? null
    const recipientStateCode = getStateCode(recipientState)

    const { lineItems } = await aggregateLedgerEntriesForInvoice(
      merchantId,
      from,
      to,
      supplierStateCode,
      recipientStateCode,
      gstRate
    )

    // CSV columns: 0=Date, 1=Order, 2=Description, 3=SAC, 4=taxableValue, 5=cgst, 6=sgst, 7=igst, 8=blank, 9=total (match admin billing page parser)
    const header = "Date,Order,Description,SAC,taxableValue,cgst,sgst,igst,,total"
    const rows = lineItems.map((item) => {
      const date = item.occurredAt.toISOString().slice(0, 10)
      const order = item.orderNumber ?? ""
      const desc = (item.description ?? "").replace(/"/g, '""')
      return `${date},${order},"${desc}",${item.sacCode},${item.taxableValue},${item.cgst},${item.sgst},${item.igst},,${item.total}`
    })
    const csv = [header, ...rows].join("\n")
    const filename = `billing-statement-${merchantId.slice(-6)}-${fromStr}-${toStr}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    })
  } catch (e) {
    console.error("[billing/statement.csv] error:", e)
    const message = e instanceof Error ? e.message : "Failed to generate statement"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
