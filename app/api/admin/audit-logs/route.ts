import { NextRequest, NextResponse } from "next/server"
import { requireAdminForApi } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { featureFlags } from "@/lib/featureFlags"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  const actor = await requireAdminForApi()
  if (actor instanceof NextResponse) return actor

  if (!featureFlags.adminAuditLogs) {
    return NextResponse.json(
      { logs: [], total: 0, error: "Feature disabled by configuration" },
      { status: 503 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const where: any = {}

    const actorUserId = searchParams.get("actorUserId")
    if (actorUserId) {
      where.actorUserId = { contains: actorUserId, mode: "insensitive" }
    }

    const entityType = searchParams.get("entityType")
    if (entityType) {
      where.entityType = entityType
    }

    const entityId = searchParams.get("entityId")
    if (entityId) {
      where.entityId = entityId
    }

    const action = searchParams.get("action")
    if (action) {
      where.action = action
    }

    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        const from = new Date(startDate)
        if (!Number.isNaN(from.getTime())) {
          where.createdAt.gte = from
        }
      }
      if (endDate) {
        const to = new Date(endDate)
        if (!Number.isNaN(to.getTime())) {
          // include entire end day
          to.setHours(23, 59, 59, 999)
          where.createdAt.lte = to
        }
      }
    }

    const limitParam = searchParams.get("limit")
    const limit = Math.min(Math.max(parseInt(limitParam || "100", 10) || 100, 1), 500)

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.adminAuditLog.count({ where }),
    ])

    return NextResponse.json({ logs, total })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load audit logs"
    return NextResponse.json({ logs: [], total: 0, error: message }, { status: 500 })
  }
}
