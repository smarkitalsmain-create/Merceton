import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMerchant } from "@/lib/auth"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const merchant = await requireMerchant()

  const { searchParams } = new URL(request.url)
  const from = searchParams.get("from") || ""
  const to = searchParams.get("to") || ""
  const type = searchParams.get("type") || "ALL"

  const where: any = {
    merchantId: merchant.id,
  }

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

  // Build a simple tab-separated file that Excel/Sheets can open as a spreadsheet.
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
  ]

  // In current schema, we only store a single `amount` per entry.
  // Map types into columns:
  // - GROSS_ORDER_VALUE -> Gross Amount
  // - PLATFORM_FEE -> Platform Fee
  // - ORDER_PAYOUT -> Net Amount
  // Other types fill Amount into Net Amount column.

  const lines: string[] = []
  lines.push(headers.join("\t"))

  for (const entry of entries) {
    const date = entry.createdAt.toISOString()
    const entryType = entry.type
    const referenceType = "ORDER"
    const referenceId = entry.orderId
    const orderId = entry.order?.orderNumber || ""
    const description = entry.description || ""
    let gross = ""
    let fee = ""
    let taxes = ""
    let net = ""

    const amountStr = entry.amount.toNumber().toFixed(2)

    if (entry.type === "GROSS_ORDER_VALUE") {
      gross = amountStr
    } else if (entry.type === "PLATFORM_FEE") {
      fee = amountStr
    } else if (entry.type === "ORDER_PAYOUT") {
      net = amountStr
    } else {
      // Fallback: put into net column
      net = amountStr
    }

    const currency = "INR"

    const row = [
      date,
      entryType,
      referenceType,
      referenceId,
      orderId,
      description.replace(/\s+/g, " "),
      gross,
      fee,
      taxes,
      net,
      currency,
    ]

    lines.push(row.join("\t"))
  }

  const fileContents = lines.join("\n")

  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, "0")
  const d = String(today.getDate()).padStart(2, "0")
  const filename = `merceton-ledger-${y}${m}${d}.xlsx`

  return new Response(fileContents, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}

