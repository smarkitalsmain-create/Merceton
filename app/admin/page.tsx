import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MerchantsList } from "@/components/admin/MerchantsList"

export default async function AdminPage() {
  await requireAdmin()

  // Get platform-wide stats
  const [totalMerchants, totalOrders, totalGMV, totalFees] = await Promise.all([
    prisma.merchant.count(),
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: {
        grossAmount: true,
      },
    }),
    prisma.ledgerEntry.aggregate({
      where: {
        type: "PLATFORM_FEE",
      },
      _sum: {
        amount: true,
      },
    }),
  ])

  // Convert Decimal fields to numbers at data boundary
  const gmv = totalGMV._sum.grossAmount?.toNumber() || 0
  const fees = Math.abs(totalFees._sum.amount?.toNumber() || 0) // Fees are negative in ledger

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Platform Overview</h1>
        <p className="text-muted-foreground">Monitor platform health and merchant activity</p>
      </div>

      {/* Platform Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Merchants</CardTitle>
            <CardDescription>Active and inactive</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalMerchants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Orders</CardTitle>
            <CardDescription>All time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total GMV</CardTitle>
            <CardDescription>Gross Merchandise Value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{gmv.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Fees</CardTitle>
            <CardDescription>Platform fees collected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">₹{fees.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Merchants List */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Merchants</h2>
        <p className="text-muted-foreground mb-6">Manage all merchants on the platform</p>
        <MerchantsList />
      </div>
    </div>
  )
}
