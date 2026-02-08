import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/admin/merchants
 * Get all merchants with stats
 * Protected by admin allowlist
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const merchants = await prisma.merchant.findMany({
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

    return NextResponse.json(merchants)
  } catch (error) {
    console.error("Admin merchants API error:", error)
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }
}
