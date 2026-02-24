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

  const [orders, onboarding] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
                hsnOrSac: true,
                gstRate: true,
              },
            },
          },
        },
      },
    }),
    prisma.merchantOnboarding.findUnique({
      where: { merchantId: merchant.id },
      select: {
        gstStatus: true,
      },
    }),
  ])

  const merchantGstStatus = onboarding?.gstStatus || ""

  const headers = [
    "Order ID",
    "Order Number",
    "Order Date",
    "Product Name",
    "SKU",
    "Quantity",
    "Unit Price",
    "Line Total",
    "HSN/SAC",
    "GST Rate",
    "Item Tax Amount",
    "Merchant GST Status",
  ]

  const lines: string[] = []
  lines.push(headers.map(csvEscape).join(","))

  for (const order of orders) {
    for (const item of order.items) {
      const qty = item.quantity
      const unitPriceInInr = item.price / 100
      const lineTotalInInr = unitPriceInInr * qty

      const product = item.product
      const gstRate = product?.gstRate ?? null
      const taxAmountInInr =
        gstRate && gstRate > 0 ? (lineTotalInInr * gstRate) / 100 : 0

      const row = [
        order.id,
        order.orderNumber,
        order.createdAt.toISOString(),
        item.productName || product?.name || "",
        item.sku || product?.sku || "",
        qty,
        unitPriceInInr.toFixed(2),
        lineTotalInInr.toFixed(2),
        product?.hsnOrSac || "",
        gstRate !== null && gstRate !== undefined ? gstRate : "",
        taxAmountInInr.toFixed(2),
        merchantGstStatus,
      ]

      lines.push(row.map(csvEscape).join(","))
    }
  }

  const fileContents = lines.join("\n")

  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, "0")
  const d = String(today.getDate()).padStart(2, "0")
  const filename = `order-items-${y}${m}${d}.csv`

  return new Response(fileContents, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}

