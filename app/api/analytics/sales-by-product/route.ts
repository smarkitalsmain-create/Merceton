export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

import { NextRequest, NextResponse } from "next/server"
import { authorizeRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { assertFeature } from "@/lib/features"

/**
 * GET /api/analytics/sales-by-product
 * 
 * Returns sales statistics grouped by product
 * 
 * Query params:
 * - from: Start date (ISO string, optional)
 * - to: End date (ISO string, optional)
 * - limit: Number of products to return (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { merchant } = await authorizeRequest()

    // Check feature access
    await assertFeature(merchant.id, "ANALYTICS_BASIC", request.nextUrl.pathname)

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

    // Get order IDs for the date range
    const orders = await prisma.order.findMany({
      where: orderFilter,
      select: { id: true },
    })

    const orderIds = orders.map((o) => o.id)

    if (orderIds.length === 0) {
      return NextResponse.json({
        products: [],
        totalRevenue: 0,
        totalQuantity: 0,
      })
    }

    // Get all order items for these orders
    const orderItems = await prisma.orderItem.findMany({
      where: {
        orderId: { in: orderIds },
      },
      select: {
        productId: true,
        quantity: true,
        price: true,
        orderId: true,
      },
    })

    // Aggregate sales by product
    const productSalesMap = new Map<
      string,
      {
        totalQuantity: number
        totalRevenue: number
        orderIds: Set<string>
      }
    >()

    for (const item of orderItems) {
      const existing = productSalesMap.get(item.productId) || {
        totalQuantity: 0,
        totalRevenue: 0,
        orderIds: new Set<string>(),
      }

      existing.totalQuantity += item.quantity
      existing.totalRevenue += item.price * item.quantity // price is in paise
      existing.orderIds.add(item.orderId)

      productSalesMap.set(item.productId, existing)
    }

    // Convert to array and sort by revenue
    const salesByProduct = Array.from(productSalesMap.entries())
      .map(([productId, data]) => ({
        productId,
        _sum: {
          quantity: data.totalQuantity,
          price: data.totalRevenue,
        },
        _count: {
          id: data.orderIds.size,
        },
      }))
      .sort((a, b) => b._sum.price - a._sum.price)
      .slice(0, limit)

    // Get product details
    const productIds = salesByProduct.map((s) => s.productId)
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        merchantId: merchant.id,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        images: {
          take: 1,
          select: { url: true },
        },
      },
    })

    const productMap = new Map(products.map((p) => [p.id, p]))

    // Format response
    const result = salesByProduct.map((sale) => {
      const product = productMap.get(sale.productId)
      const totalRevenue = (sale._sum.price || 0) / 100 // Convert paise to INR (already multiplied by quantity)

      return {
        productId: sale.productId,
        productName: product?.name || "Unknown Product",
        sku: product?.sku || null,
        imageUrl: product?.images[0]?.url || null,
        totalRevenue,
        totalQuantity: sale._sum.quantity || 0,
        orderCount: sale._count.id || 0,
        averageOrderValue: sale._count.id > 0 ? totalRevenue / sale._count.id : 0,
      }
    })

    // Calculate totals
    const totalRevenue = result.reduce((sum, p) => sum + p.totalRevenue, 0)
    const totalQuantity = result.reduce((sum, p) => sum + p.totalQuantity, 0)

    return NextResponse.json({
      products: result,
      totalRevenue,
      totalQuantity,
      period: {
        from: from || null,
        to: to || null,
      },
    })
  } catch (error) {
    console.error("Sales by product analytics error:", error)

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
      { error: "Failed to fetch sales by product data" },
      { status: 500 }
    )
  }
}
