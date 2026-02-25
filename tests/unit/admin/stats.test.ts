import { describe, it, expect, vi, beforeEach } from "vitest"
import { getAdminStats } from "@/lib/admin/stats"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    merchant: { count: vi.fn() },
    order: { aggregate: vi.fn() },
    ledgerEntry: { aggregate: vi.fn() },
    payoutBatch: { aggregate: vi.fn() },
  },
}))

describe("getAdminStats", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { prisma } = await import("@/lib/prisma")
    vi.mocked(prisma.merchant.count).mockResolvedValue(10)
    vi.mocked(prisma.order.aggregate)
      .mockResolvedValueOnce({
        _count: { id: 100 },
        _sum: { totalAmount: 500000, platformFee: 5000 },
      } as never)
      .mockResolvedValueOnce({
        _count: { id: 12 },
        _sum: { totalAmount: 60000 },
      } as never)
    vi.mocked(prisma.ledgerEntry.aggregate).mockResolvedValue({
      _sum: { amount: 5000 },
    } as never)
    vi.mocked(prisma.payoutBatch.aggregate)
      .mockResolvedValueOnce({ _sum: { totalAmount: 2000 } } as never)
      .mockResolvedValueOnce({ _sum: { totalAmount: 1500 } } as never)
  })

  it("returns all required KPI keys with numbers", async () => {
    const stats = await getAdminStats()
    expect(stats).toMatchObject({
      merchantsCount: expect.any(Number),
      ordersCount: expect.any(Number),
      gmvTotal: expect.any(Number),
      platformFeesTotal: expect.any(Number),
      netReceivable: expect.any(Number),
      pendingPayouts: expect.any(Number),
      last7DaysOrders: expect.any(Number),
      last7DaysGmv: expect.any(Number),
    })
    expect(Number.isNaN(stats.merchantsCount)).toBe(false)
    expect(Number.isNaN(stats.gmvTotal)).toBe(false)
    expect(Number.isNaN(stats.netReceivable)).toBe(false)
  })

  it("computes netReceivable from platform fees minus completed payouts", async () => {
    vi.clearAllMocks()
    const { prisma } = await import("@/lib/prisma")
    vi.mocked(prisma.merchant.count).mockResolvedValue(0)
    vi.mocked(prisma.order.aggregate)
      .mockResolvedValueOnce({
        _count: { id: 0 },
        _sum: { totalAmount: 0, platformFee: 0 },
      } as never)
      .mockResolvedValueOnce({
        _count: { id: 0 },
        _sum: { totalAmount: 0 },
      } as never)
    vi.mocked(prisma.ledgerEntry.aggregate).mockResolvedValue({
      _sum: { amount: 10000 },
    } as never)
    vi.mocked(prisma.payoutBatch.aggregate)
      .mockResolvedValueOnce({ _sum: { totalAmount: 3000 } } as never)
      .mockResolvedValueOnce({ _sum: { totalAmount: 500 } } as never)
    const stats = await getAdminStats()
    expect(stats.platformFeesTotal).toBe(10000)
    expect(stats.netReceivable).toBe(7000)
  })
})
