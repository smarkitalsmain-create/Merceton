import { NextResponse } from "next/server"
import { requireAdminForApi } from "@/lib/admin-auth"
import { featureFlags } from "@/lib/featureFlags"
import { prisma } from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

function toNumber(d: unknown): number {
  if (d == null) return 0
  if (typeof d === "number") return d
  if (typeof d === "string") return parseFloat(d) || 0
  if (Decimal.isDecimal(d)) return Number(d)
  return 0
}

/**
 * GET /api/admin/merchants
 * Returns list of merchants for admin list view.
 */
export async function GET() {
  const actor = await requireAdminForApi()
  if (actor instanceof NextResponse) return actor
  if (!featureFlags.adminMerchants) {
    return NextResponse.json(
      { error: "Feature disabled by configuration" },
      { status: 503 }
    )
  }

  try {
    const merchants = await prisma.merchant.findMany({
      select: {
        id: true,
        slug: true,
        displayName: true,
        isActive: true,
        feePercentageBps: true,
        feeFlatPaise: true,
        feeMaxCapPaise: true,
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
      orderBy: { createdAt: "desc" },
    })

    const list = merchants.map((m) => ({
      id: m.id,
      slug: m.slug,
      displayName: m.displayName,
      isActive: m.isActive,
      feePercentageBps: m.feePercentageBps,
      feeFlatPaise: m.feeFlatPaise,
      feeMaxCapPaise: m.feeMaxCapPaise,
      _count: m._count,
      orders: m.orders.map((o) => ({
        grossAmount: toNumber(o.grossAmount),
        platformFee: toNumber(o.platformFee),
      })),
    }))

    return NextResponse.json(list)
  } catch (e) {
    console.error("[admin/merchants] GET error:", e)
    const message = e instanceof Error ? e.message : "Failed to load merchants"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
