import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { Prisma } from "@prisma/client"
import { optionalJson } from "@/lib/prismaJson"

export interface AuditLogInput {
  actorUserId: string
  actorEmail?: string | null
  actionType: string // Keep for backward compatibility, maps to `action` field
  entityType: string
  entityId?: string | null
  reason: string
  beforeJson?: Prisma.InputJsonValue | null
  afterJson?: Prisma.InputJsonValue | null
  metadata?: Prisma.InputJsonValue | null
}

/**
 * Log an admin action to the audit log
 * This is the single source of truth for all admin audit logging
 */
export async function logAdminAction(input: AuditLogInput): Promise<void> {
  // Get IP and user agent from headers (optional)
  const headersList = await headers()
  const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || null
  const userAgent = headersList.get("user-agent") || null

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: input.actorUserId,
      actorEmail: input.actorEmail || null,
      actionType: input.actionType, // Use actionType field (not action)
      entityType: input.entityType,
      entityId: input.entityId || null,
      reason: input.reason,
      // Omit optional JSON fields when null/undefined (preferred for optional Json? fields)
      beforeJson: optionalJson(input.beforeJson),
      afterJson: optionalJson(input.afterJson),
      ip: ip,
      userAgent: userAgent,
      metadata: optionalJson(input.metadata),
    },
  })
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(filters: {
  actorUserId?: string
  entityType?: string
  entityId?: string
  actionType?: string // Keep for backward compatibility, maps to `action` field
  startDate?: Date
  endDate?: Date
  limit?: number
}) {
  const where: any = {}

  if (filters.actorUserId) {
    where.actorUserId = filters.actorUserId
  }
  if (filters.entityType) {
    where.entityType = filters.entityType
  }
  if (filters.entityId) {
    where.entityId = filters.entityId
  }
  if (filters.actionType) {
    where.actionType = filters.actionType // Use actionType field (not action)
  }
  if (filters.startDate || filters.endDate) {
    where.createdAt = {}
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate
    }
  }

  return prisma.adminAuditLog.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    take: filters.limit || 100,
  })
}
