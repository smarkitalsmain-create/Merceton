import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMerchant } from "@/lib/auth"

export const runtime = "nodejs"

function csvEscape(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? "" : String(value)
  const escaped = str.replace(/"/g, '""')
  return `"${escaped}"`
}

export async function GET(request: NextRequest) {
  const merchant = await requireMerchant()
  const { searchParams } = new URL(request.url)

  const from = searchParams.get("from") || ""
  const to = searchParams.get("to") || ""

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

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "asc" },
  })

  const headers = [
    "Order ID",
    "Order Number",
    "Order Date",
    "Customer Name",
    "Customer Email",
    "Subtotal",
    "Tax Total",
    "Shipping Fee",
    "Discount",
    "Total Amount",
    "Platform Fee",
    "Net Receivable",
    "Currency",
    "Payment Status",
    "Settlement Status",
  ]

  const lines: string[] = []
  lines.push(headers.map(csvEscape).join(","))

  for (const order of orders) {
    const subtotal = order.subtotal.toNumber().toFixed(2)
    const taxTotal = order.tax.toNumber().toFixed(2)
    const shippingFee = order.shippingFee.toNumber().toFixed(2)
    const discount = order.discount.toNumber().toFixed(2)
    const totalAmount = order.totalAmount.toNumber().toFixed(2)
    const platformFee = order.platformFee.toNumber().toFixed(2)
    const netReceivable = order.netPayable.toNumber().toFixed(2)

    const row = [
      order.id,
      order.orderNumber,
      order.createdAt.toISOString(),
      order.customerName,
      order.customerEmail,
      subtotal,
      taxTotal,
      shippingFee,
      discount,
      totalAmount,
      platformFee,
      netReceivable,
      "INR",
      order.paymentStatus,
      order.settlementStatus,
    ]

    lines.push(row.map(csvEscape).join(","))
  }

  const fileContents = lines.join("\n")

  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, "0")
  const d = String(today.getDate()).padStart(2, "0")
  const filename = `orders-${y}${m}${d}.csv`

  return new Response(fileContents, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}

