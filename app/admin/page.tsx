export const runtime = "nodejs"

import { requireSuperAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminActivityFeed } from "@/components/admin/AdminActivityFeed"

export default async function AdminPage() {
  await requireSuperAdmin()

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Get platform-wide stats
  const [
    totalMerchants,
    activeMerchants,
    orders7d,
    orders30d,
    gmv7d,
    gmv30d,
    fees7d,
    fees30d,
    pendingPayouts,
    recentMerchants,
    recentOrders,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.merchant.count(),
    prisma.merchant.count({ where: { isActive: true } }),
    prisma.order.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.order.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: sevenDaysAgo } },
      _sum: { grossAmount: true },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: thirtyDaysAgo } },
      _sum: { grossAmount: true },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: sevenDaysAgo } },
      _sum: { platformFee: true },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: thirtyDaysAgo } },
      _sum: { platformFee: true },
    }),
    prisma.payoutBatch.aggregate({
      where: { status: "PENDING" },
      _sum: { totalAmount: true },
    }),
    prisma.merchant.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        displayName: true,
        slug: true,
        createdAt: true,
      },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        merchant: {
          select: { displayName: true, slug: true },
        },
      },
    }),
    prisma.adminAuditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        actorEmail: true,
        actionType: true,
        entityType: true,
        createdAt: true,
      },
    }),
  ])

  const gmv7dNum = gmv7d._sum.grossAmount?.toNumber() || 0
  const gmv30dNum = gmv30d._sum.grossAmount?.toNumber() || 0
  const fees7dNum = fees7d._sum.platformFee?.toNumber() || 0
  const fees30dNum = fees30d._sum.platformFee?.toNumber() || 0
  const pendingPayoutsNum = pendingPayouts._sum.totalAmount?.toNumber() || 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Super Admin Console</h1>
        <p className="text-muted-foreground">Platform overview and activity</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Merchants</CardTitle>
            <CardDescription>All merchants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMerchants}</div>
            <p className="text-xs text-muted-foreground mt-1">{activeMerchants} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Orders (7d / 30d)</CardTitle>
            <CardDescription>Recent orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders7d}</div>
            <p className="text-xs text-muted-foreground mt-1">{orders30d} in last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">GMV (7d / 30d)</CardTitle>
            <CardDescription>Gross Merchandise Value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{gmv7dNum.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">₹{gmv30dNum.toFixed(2)} in last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Platform Fees (7d / 30d)</CardTitle>
            <CardDescription>Fees earned</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{fees7dNum.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">₹{fees30dNum.toFixed(2)} in last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pending Payouts</CardTitle>
            <CardDescription>Total pending payout amount</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{pendingPayoutsNum.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Merchants</CardTitle>
            <CardDescription>Latest merchant signups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentMerchants.map((merchant) => (
                <div key={merchant.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{merchant.displayName}</p>
                    <p className="text-xs text-muted-foreground">/{merchant.slug}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(merchant.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest platform orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{order.merchant.displayName}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ₹{order.grossAmount.toNumber().toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Feed */}
      <AdminActivityFeed logs={recentAuditLogs} />
    </div>
  )
}
