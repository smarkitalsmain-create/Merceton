export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

import { NextRequest, NextResponse } from "next/server"
import { authorizeRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { assertFeature } from "@/lib/features"

/**
 * GET /api/analytics/sales-by-date
 * 
 * Returns sales statistics grouped by date
 * 
 * Query params:
 * - from: Start date (ISO string, required)
 * - to: End date (ISO string, required)
 * - groupBy: "day" | "week" | "month" (default: "day")
 */
export async function GET(request: NextRequest) {
  try {
    const { merchant } = await authorizeRequest()

    // Check feature access
    await assertFeature(merchant.id, "ANALYTICS_BASIC", request.nextUrl.pathname)

    const url = new URL(request.url)
    const from = url.searchParams.get("from")
    const to = url.searchParams.get("to")
    const groupBy = url.searchParams.get("groupBy") || "day"

    if (!from || !to) {
      return NextResponse.json(
        { error: "from and to date parameters are required" },
        { status: 400 }
      )
    }

    const fromDate = new Date(from)
    const toDate = new Date(to)

    // Get orders in date range (only paid orders)
    const orders = await prisma.order.findMany({
      where: {
        merchantId: merchant.id,
        payment: {
          status: "PAID",
        },
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      select: {
        id: true,
        createdAt: true,
        grossAmount: true,
        discount: true,
        netPayable: true,
        items: {
          select: {
            quantity: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    // Group by date
    const salesByDate = new Map<string, {
      date: string
      revenue: number
      orders: number
      quantity: number
      discount: number
    }>()

    for (const order of orders) {
      let dateKey: string
      const orderDate = new Date(order.createdAt)

      switch (groupBy) {
        case "week":
          // Get week start (Monday)
          const weekStart = new Date(orderDate)
          weekStart.setDate(orderDate.getDate() - orderDate.getDay() + 1)
          dateKey = weekStart.toISOString().split("T")[0]
          break
        case "month":
          dateKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}`
          break
        case "day":
        default:
          dateKey = orderDate.toISOString().split("T")[0]
          break
      }

      const existing = salesByDate.get(dateKey) || {
        date: dateKey,
        revenue: 0,
        orders: 0,
        quantity: 0,
        discount: 0,
      }

      existing.revenue += order.grossAmount.toNumber()
      existing.orders += 1
      existing.quantity += order.items.reduce((sum, item) => sum + item.quantity, 0)
      existing.discount += order.discount.toNumber()

      salesByDate.set(dateKey, existing)
    }

    // Convert to array and sort by date
    const result = Array.from(salesByDate.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    )

    // Calculate totals
    const totals = result.reduce(
      (acc, day) => ({
        revenue: acc.revenue + day.revenue,
        orders: acc.orders + day.orders,
        quantity: acc.quantity + day.quantity,
        discount: acc.discount + day.discount,
      }),
      { revenue: 0, orders: 0, quantity: 0, discount: 0 }
    )

    return NextResponse.json({
      sales: result,
      totals,
      period: {
        from,
        to,
        groupBy,
      },
    })
  } catch (error) {
    console.error("Sales by date analytics error:", error)

    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
      if (error.message.includes("FeatureDeniedError") || error.message.includes("feature")) {
        return NextResponse.json(
          {
            error: "Analytics is not available on your plan. Upgrade to Growth plan to enable this feature.",
            upgradeRequired: true,
            featureKey: "ANALYTICS_BASIC",
          },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      { error: "Failed to fetch sales by date data" },
      { status: 500 }
    )
  }
}
