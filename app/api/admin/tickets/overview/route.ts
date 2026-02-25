import { NextRequest, NextResponse } from "next/server"
import { requireAdminForApi } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { parseRange, rangeToIso } from "@/lib/date/ranges"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const OPEN_STATUSES = ["OPEN", "PENDING"] as const

export interface TicketsOverviewResponse {
  range: { from: string; to: string }
  createdCount: number
  openCount: number
  unassignedCount: number
  staleCount: number
  byStatus: Record<string, number>
  byPriority: Record<string, number>
  topMerchants: Array<{
    merchantId: string
    merchantName: string | null
    count: number
  }>
  avgFirstResponseHours?: number
  avgResolutionHours?: number
}

/** GET /api/admin/tickets/overview?range=7d|30d|90d|this_month|last_month */
export async function GET(request: NextRequest) {
  const actor = await requireAdminForApi()
  if (actor instanceof NextResponse) return actor

  try {
    const { searchParams } = new URL(request.url)
    const range = parseRange({
      range: searchParams.get("range") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    })
    const iso = rangeToIso(range)

    const staleThreshold = new Date()
    staleThreshold.setHours(staleThreshold.getHours() - 48)

    const [
      createdCount,
      openCount,
      unassignedCount,
      staleCount,
      byStatusRows,
      byPriorityRows,
      topMerchantRows,
      avgResolutionResult,
    ] = await Promise.all([
      prisma.ticket.count({
        where: {
          createdAt: { gte: range.from, lte: range.to },
        },
      }),
      prisma.ticket.count({
        where: { status: { in: [...OPEN_STATUSES] } },
      }),
      prisma.ticket.count({
        where: {
          status: { in: [...OPEN_STATUSES] },
          assignedToUserId: null,
        },
      }),
      prisma.ticket.count({
        where: {
          status: { in: [...OPEN_STATUSES] },
          updatedAt: { lt: staleThreshold },
        },
      }),
      prisma.ticket.groupBy({
        by: ["status"],
        where: {
          createdAt: { gte: range.from, lte: range.to },
        },
        _count: { id: true },
      }),
      prisma.ticket.groupBy({
        by: ["priority"],
        where: {
          createdAt: { gte: range.from, lte: range.to },
        },
        _count: { id: true },
      }),
      prisma.ticket.groupBy({
        by: ["merchantId"],
        where: {
          createdAt: { gte: range.from, lte: range.to },
        },
        _count: { id: true },
      }),
      prisma.$queryRaw<[{ avg_hours: number | null }]>`
        SELECT AVG(EXTRACT(EPOCH FROM ("closedAt" - "createdAt")) / 3600) AS avg_hours
        FROM tickets
        WHERE "closedAt" IS NOT NULL
          AND "createdAt" >= ${range.from}
          AND "createdAt" <= ${range.to}
      `,
    ])

    const byStatus: Record<string, number> = {}
    for (const row of byStatusRows) {
      byStatus[row.status] = row._count.id
    }
    const byPriority: Record<string, number> = {}
    for (const row of byPriorityRows) {
      byPriority[row.priority] = row._count.id
    }

    const sorted = [...topMerchantRows].sort((a, b) => b._count.id - a._count.id)
    const merchantIds = sorted.slice(0, 5).map((r) => r.merchantId)
    const merchants =
      merchantIds.length > 0
        ? await prisma.merchant.findMany({
            where: { id: { in: merchantIds } },
            select: { id: true, displayName: true },
          })
        : []
    const merchantMap = new Map(merchants.map((m) => [m.id, m.displayName]))
    const topMerchants = sorted.slice(0, 5).map((r: (typeof sorted)[number]) => ({
      merchantId: r.merchantId,
      merchantName: merchantMap.get(r.merchantId) ?? null,
      count: r._count.id,
    }))

    const avgResolutionHours =
      avgResolutionResult?.[0]?.avg_hours != null &&
      Number.isFinite(Number(avgResolutionResult[0].avg_hours))
        ? Math.round(Number(avgResolutionResult[0].avg_hours) * 10) / 10
        : undefined

    const body: TicketsOverviewResponse = {
      range: iso,
      createdCount,
      openCount,
      unassignedCount,
      staleCount,
      byStatus,
      byPriority,
      topMerchants,
      avgResolutionHours,
    }
    return NextResponse.json(body)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load ticket overview"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
