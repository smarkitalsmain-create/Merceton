import { NextRequest, NextResponse } from "next/server"
import { requireAdminForApi } from "@/lib/admin-auth"
import { featureFlags } from "@/lib/featureFlags"
import { prisma } from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

function toNum(d: unknown): number {
  if (d == null) return 0
  if (typeof d === "number") return d
  if (Decimal.isDecimal(d)) return Number(d)
  if (typeof d === "string") return parseFloat(d) || 0
  return 0
}

/**
 * GET /api/admin/merchants/[merchantId]/ledger
 * Returns CSV of ledger entries for the merchant (admin download).
 */
export async function GET(
  request: NextRequest,
  context: { params: { merchantId: string } }
) {
  const actor = await requireAdminForApi()
  if (actor instanceof NextResponse) return actor
  if (!featureFlags.adminMerchantsLedger) {
    return NextResponse.json(
      { error: "Feature disabled by configuration" },
      { status: 503 }
    )
  }

  const merchantId = context.params.merchantId
  const { searchParams } = new URL(request.url)
  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")

  const from = fromParam ? new Date(fromParam) : new Date(0)
  const to = toParam ? new Date(toParam) : new Date()

  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { id: true },
    })
    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 })
    }

    const entries = await prisma.ledgerEntry.findMany({
      where: {
        merchantId,
        createdAt: { gte: from, lte: to },
      },
      orderBy: { createdAt: "asc" },
      include: {
        order: {
          select: { orderNumber: true },
        },
      },
    })

    const header = "Date,Order,Type,Amount,Description,Status,CreatedAt"
    const rows = entries.map((e) => {
      const date = e.createdAt.toISOString().slice(0, 10)
      const orderNum = e.order?.orderNumber ?? ""
      const amount = toNum(e.amount)
      const desc = (e.description ?? "").replace(/"/g, '""')
      return `${date},${orderNum},${e.type},${amount},"${desc}",${e.status},${e.createdAt.toISOString()}`
    })
    const csv = [header, ...rows].join("\n")
    const filename = `merchant-ledger-${merchantId.slice(-8)}-${from.toISOString().slice(0, 10)}-${to.toISOString().slice(0, 10)}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    })
  } catch (e) {
    console.error("[admin/merchants/ledger] error:", e)
    const message = e instanceof Error ? e.message : "Failed to export ledger"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
