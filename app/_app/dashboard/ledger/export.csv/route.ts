import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMerchant } from "@/lib/auth"
import { toCsv } from "@/lib/csv"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const merchant = await requireMerchant()
  const { searchParams } = new URL(request.url)

  const from = searchParams.get("from") || ""
  const to = searchParams.get("to") || ""
  const type = searchParams.get("type") || "ALL"

  const where: any = { merchantId: merchant.id }

  if (from || to) {
    where.createdAt = {}
    if (from) {
      where.createdAt.gte = new Date(from)
    }
    if (to) {
      const end = new Date(to)
      end.setHours(23, 59, 59, 999)
      where.createdAt.lte = end
    }
  }

  if (type && type !== "ALL") {
    where.type = type
  }

  const entries = await prisma.ledgerEntry.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: {
      order: {
        select: {
          orderNumber: true,
        },
      },
    },
  })

  const headers = [
    "Date",
    "Entry Type",
    "Reference Type",
    "Reference ID",
    "Order ID",
    "Description",
    "Gross Amount",
    "Platform Fee",
    "Taxes",
    "Net Amount",
    "Currency",
    "Created At",
  ]

  const rows: (string | number | null | undefined)[][] = []

  for (const entry of entries) {
    const createdIso = entry.createdAt.toISOString()
    const date = createdIso.slice(0, 10)
    const entryType = entry.type
    const referenceType = "ORDER"
    const referenceId = entry.orderId
    const orderId = entry.order?.orderNumber || ""
    const description = entry.description || ""

    let gross: string | null = ""
    let fee: string | null = ""
    let taxes: string | null = ""
    let net: string | null = ""

    const amountStr = entry.amount.toNumber().toFixed(2)

    if (entry.type === "GROSS_ORDER_VALUE") {
      gross = amountStr
    } else if (entry.type === "PLATFORM_FEE") {
      fee = amountStr
    } else if (entry.type === "ORDER_PAYOUT") {
      net = amountStr
    } else {
      net = amountStr
    }

    const currency = "INR"

    rows.push([
      date,
      entryType,
      referenceType,
      referenceId,
      orderId,
      description,
      gross,
      fee,
      taxes,
      net,
      currency,
      createdIso,
    ])
  }

  const csv = toCsv(headers, rows)

  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, "0")
  const d = String(today.getDate()).padStart(2, "0")
  const filename = `merceton-ledger-${y}${m}${d}.csv`

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}

