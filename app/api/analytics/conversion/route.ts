export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

import { NextRequest, NextResponse } from "next/server"
import { authorizeRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { assertFeature } from "@/lib/features"

/**
 * GET /api/analytics/conversion
 * 
 * Returns conversion metrics (proxy: orders created vs paid)
 * 
 * Query params:
 * - from: Start date (ISO string, optional)
 * - to: End date (ISO string, optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { merchant } = await authorizeRequest()

    // Check feature access
    await assertFeature(merchant.id, "ANALYTICS_BASIC", request.nextUrl.pathname)

    const url = new URL(request.url)
    const from = url.searchParams.get("from")
    const to = url.searchParams.get("to")

    // Build date filter
    const dateFilter: any = {}
    if (from) {
      dateFilter.gte = new Date(from)
    }
    if (to) {
      dateFilter.lte = new Date(to)
    }

    // Build base filter
    const baseFilter: any = {
      merchantId: merchant.id,
    }
    if (Object.keys(dateFilter).length > 0) {
      baseFilter.createdAt = dateFilter
    }

    // Get total orders created (checkout started proxy)
    const totalOrders = await prisma.order.count({
      where: baseFilter,
    })

    // Get paid orders (conversions)
    const paidOrders = await prisma.order.count({
      where: {
        ...baseFilter,
        payment: {
          status: "PAID",
        },
      },
    })

    // Get orders by payment status for breakdown
    const ordersByStatus = await prisma.order.groupBy({
      by: ["paymentStatus"],
      where: baseFilter,
      _count: {
        id: true,
      },
    })

    const statusBreakdown = ordersByStatus.reduce(
      (acc, item) => {
        acc[item.paymentStatus] = item._count.id
        return acc
      },
      {} as Record<string, number>
    )

    // Calculate conversion rate
    const conversionRate = totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0

    // Get revenue from paid orders
    const paidOrdersData = await prisma.order.findMany({
      where: {
        ...baseFilter,
        payment: {
          status: "PAID",
        },
      },
      select: {
        grossAmount: true,
      },
    })

    const totalRevenue = paidOrdersData.reduce(
      (sum, order) => sum + order.grossAmount.toNumber(),
      0
    )

    return NextResponse.json({
      totalOrders, // Checkout started (proxy)
      paidOrders, // Conversions
      conversionRate: Math.round(conversionRate * 100) / 100, // Round to 2 decimal places
      totalRevenue,
      averageOrderValue: paidOrders > 0 ? totalRevenue / paidOrders : 0,
      statusBreakdown,
      period: {
        from: from || null,
        to: to || null,
      },
      note: "Conversion rate is calculated as: (Paid Orders / Total Orders) × 100. This is a proxy metric based on order creation vs payment completion.",
    })
  } catch (error) {
    console.error("Conversion analytics error:", error)

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
      { error: "Failed to fetch conversion data" },
      { status: 500 }
    )
  }
}
