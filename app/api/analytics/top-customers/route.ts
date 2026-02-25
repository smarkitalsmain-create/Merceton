export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

import { NextRequest, NextResponse } from "next/server"
import { authorizeRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { assertFeature, FeatureDeniedError, featureDeniedResponse } from "@/lib/features"
import { GROWTH_FEATURE_KEYS } from "@/lib/features/featureKeys"

/**
 * GET /api/analytics/top-customers
 * 
 * Returns top customers by revenue
 * 
 * Query params:
 * - from: Start date (ISO string, optional)
 * - to: End date (ISO string, optional)
 * - limit: Number of customers to return (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { merchant } = await authorizeRequest()

    // Check feature access
    await assertFeature(merchant.id, GROWTH_FEATURE_KEYS.G_ADV_ANALYTICS, request.nextUrl.pathname)

    const url = new URL(request.url)
    const from = url.searchParams.get("from")
    const to = url.searchParams.get("to")
    const limit = parseInt(url.searchParams.get("limit") || "20", 10)

    // Build date filter
    const dateFilter: any = {}
    if (from) {
      dateFilter.gte = new Date(from)
    }
    if (to) {
      dateFilter.lte = new Date(to)
    }

    // Build order filter (only paid orders)
    const orderFilter: any = {
      merchantId: merchant.id,
      payment: {
        status: "PAID",
      },
    }
    if (Object.keys(dateFilter).length > 0) {
      orderFilter.createdAt = dateFilter
    }

    // Get orders and group by customer email
    const orders = await prisma.order.findMany({
      where: orderFilter,
      select: {
        customerEmail: true,
        customerName: true,
        customerPhone: true,
        grossAmount: true,
        createdAt: true,
      },
    })

    // Group by customer email
    const customerMap = new Map<
      string,
      {
        email: string
        name: string
        phone: string | null
        totalRevenue: number
        orderCount: number
        firstOrderDate: Date
        lastOrderDate: Date
      }
    >()

    for (const order of orders) {
      const email = order.customerEmail.toLowerCase().trim()
      const existing = customerMap.get(email) || {
        email: order.customerEmail,
        name: order.customerName,
        phone: order.customerPhone,
        totalRevenue: 0,
        orderCount: 0,
        firstOrderDate: order.createdAt,
        lastOrderDate: order.createdAt,
      }

      existing.totalRevenue += order.grossAmount.toNumber()
      existing.orderCount += 1
      if (order.createdAt < existing.firstOrderDate) {
        existing.firstOrderDate = order.createdAt
      }
      if (order.createdAt > existing.lastOrderDate) {
        existing.lastOrderDate = order.createdAt
      }

      customerMap.set(email, existing)
    }

    // Convert to array, sort by revenue, and take top N
    const result = Array.from(customerMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit)
      .map((customer) => ({
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        totalRevenue: customer.totalRevenue,
        orderCount: customer.orderCount,
        averageOrderValue: customer.orderCount > 0 ? customer.totalRevenue / customer.orderCount : 0,
        firstOrderDate: customer.firstOrderDate.toISOString(),
        lastOrderDate: customer.lastOrderDate.toISOString(),
      }))

    // Calculate totals
    const totals = result.reduce(
      (acc, customer) => ({
        revenue: acc.revenue + customer.totalRevenue,
        orders: acc.orders + customer.orderCount,
      }),
      { revenue: 0, orders: 0 }
    )

    return NextResponse.json({
      customers: result,
      totals,
      period: {
        from: from || null,
        to: to || null,
      },
    })
  } catch (error) {
    console.error("Top customers analytics error:", error)

    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
      if (error instanceof FeatureDeniedError) {
        return featureDeniedResponse(error)
      }
    }

    return NextResponse.json(
      { error: "Failed to fetch top customers data" },
      { status: 500 }
    )
  }
}
