/**
 * Admin dashboard stats: aggregates only, no full rows.
 * Safe for production; Decimal results converted to number.
 */

import { prisma } from "@/lib/prisma"

function toNum(value: unknown): number {
  if (value == null) return 0
  if (typeof value === "number" && !Number.isNaN(value)) return value
  const n = Number(value)
  return Number.isNaN(n) ? 0 : n
}

export interface AdminStats {
  merchantsCount: number
  ordersCount: number
  gmvTotal: number
  platformFeesTotal: number
  netReceivable: number
  pendingPayouts: number
  last7DaysOrders: number
  last7DaysGmv: number
}

export async function getAdminStats(): Promise<AdminStats> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [
    merchantsCount,
    ordersAgg,
    ordersLast7Agg,
    platformFeesFromOrders,
    payoutsCompletedAgg,
    payoutsPendingAgg,
  ] = await Promise.all([
    prisma.merchant.count(),
    prisma.order.aggregate({
      _count: { id: true },
      _sum: { totalAmount: true, platformFee: true },
    }),
    prisma.order.aggregate({
      _count: { id: true },
      _sum: { totalAmount: true },
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: { type: "PLATFORM_FEE" },
    }),
    prisma.payoutBatch.aggregate({
      _sum: { totalAmount: true },
      where: { status: "COMPLETED" },
    }),
    prisma.payoutBatch.aggregate({
      _sum: { totalAmount: true },
      where: { status: { in: ["PENDING", "PROCESSING"] } },
    }),
  ])

  const gmvTotal = toNum(ordersAgg._sum.totalAmount)
  const platformFeesFromOrderSum = toNum(ordersAgg._sum.platformFee)
  const platformFeesFromLedger = toNum(platformFeesFromOrders._sum.amount)
  const platformFeesTotal =
    platformFeesFromLedger > 0 ? platformFeesFromLedger : platformFeesFromOrderSum
  const payoutsCompleted = toNum(payoutsCompletedAgg._sum.totalAmount)
  const netReceivable = platformFeesTotal - payoutsCompleted
  const pendingPayouts = toNum(payoutsPendingAgg._sum.totalAmount)

  return {
    merchantsCount: merchantsCount ?? 0,
    ordersCount: ordersAgg._count.id ?? 0,
    gmvTotal,
    platformFeesTotal,
    netReceivable,
    pendingPayouts,
    last7DaysOrders: ordersLast7Agg._count.id ?? 0,
    last7DaysGmv: toNum(ordersLast7Agg._sum.totalAmount),
  }
}
