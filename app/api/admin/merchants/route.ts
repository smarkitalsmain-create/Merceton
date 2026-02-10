export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { requirePlatformAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/admin/merchants
 * Get all merchants with stats
 * Protected by admin allowlist
 */
export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdmin()

    const merchantsRaw = await prisma.merchant.findMany({
      include: {
        _count: {
          select: {
            orders: true,
            products: true,
          },
        },
        orders: {
          select: {
            grossAmount: true,
            platformFee: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Convert Decimal fields to numbers at data boundary
    const merchants = merchantsRaw.map((merchant) => ({
      ...merchant,
      orders: merchant.orders.map((order) => ({
        grossAmount: order.grossAmount.toNumber(),
        platformFee: order.platformFee.toNumber(),
      })),
    }))

    return NextResponse.json(merchants)
  } catch (error) {
    console.error("Admin merchants API error:", error)
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }
}
