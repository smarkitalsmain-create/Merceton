import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const merchant = await requireMerchant()

  // Get stats - all queries scoped to merchant.id for tenant isolation
  const [productCount, orderCount, paidPayments] = await Promise.all([
    prisma.product.count({ where: { merchantId: merchant.id } }),
    prisma.order.count({ where: { merchantId: merchant.id } }),
    prisma.payment.findMany({
      where: { merchantId: merchant.id, status: "PAID" },
      select: { amount: true },
    }),
  ])

  const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount.toNumber(), 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {merchant.displayName}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>Total active products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productCount}</div>
            <Link href="/dashboard/products">
              <Button variant="link" className="p-0 mt-2">
                Manage products →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>Total orders received</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderCount}</div>
            <Link href="/dashboard/orders">
              <Button variant="link" className="p-0 mt-2">
                View orders →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Total payout amount</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
            <Link href="/dashboard/orders">
              <Button variant="link" className="p-0 mt-2">
                View details →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/products">
              <Button variant="outline" className="w-full justify-start">
                Add New Product
              </Button>
            </Link>
            <Link href={`/s/${merchant.slug}`} target="_blank">
              <Button variant="outline" className="w-full justify-start">
                View Storefront
              </Button>
            </Link>
            <div className="space-y-1">
              <Link href="/dashboard/storefront">
                <Button variant="outline" className="w-full justify-start">
                  Design Storefront
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground px-3">
                Customize your store appearance
              </p>
            </div>
            <div className="space-y-1">
              <Link href="/dashboard/settings/domain">
                <Button variant="outline" className="w-full justify-start">
                  Connect Custom Domain
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground px-3">
                Use your own domain name
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Store Settings</CardTitle>
            <CardDescription>Manage your store configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/settings">
              <Button className="w-full">Go to Settings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
