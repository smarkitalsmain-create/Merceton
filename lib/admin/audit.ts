import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

export interface AuditLogInput {
  actorUserId: string
  actorEmail?: string | null
  actionType: string
  entityType: string
  entityId?: string | null
  reason: string
  beforeJson?: any
  afterJson?: any
  metadata?: any
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
      actionType: input.actionType,
      entityType: input.entityType,
      entityId: input.entityId || null,
      reason: input.reason,
      beforeJson: input.beforeJson ? (input.beforeJson as any) : null,
      afterJson: input.afterJson ? (input.afterJson as any) : null,
      ip: ip,
      userAgent: userAgent,
      metadata: input.metadata ? (input.metadata as any) : null,
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
  actionType?: string
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
    where.actionType = filters.actionType
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
