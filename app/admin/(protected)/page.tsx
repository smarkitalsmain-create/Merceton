import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Store,
  ShoppingCart,
  CreditCard,
  Wallet,
  FileText,
  Settings,
  TrendingUp,
  Receipt,
  Banknote,
  Users,
} from "lucide-react"
import { getAdminStats } from "@/lib/admin/stats"
import { getOpsOverview } from "@/lib/admin/ops-overview"
import { SupportOverview } from "@/components/admin/SupportOverview"
import { OpsOverview } from "@/components/admin/OpsOverview"

const quickLinks = [
  { name: "Merchants", href: "/admin/merchants", icon: Store },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Pricing", href: "/admin/pricing", icon: CreditCard },
  { name: "Payouts", href: "/admin/payouts", icon: Wallet },
  { name: "Platform Invoices", href: "/admin/platform-invoices", icon: FileText },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

function formatRupee(n: number): string {
  if (!Number.isFinite(n)) return "₹0"
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(n)
}

export default async function AdminPage() {
  let stats: Awaited<ReturnType<typeof getAdminStats>> | null = null
  let statsError: string | null = null
  let opsData: Awaited<ReturnType<typeof getOpsOverview>> | null = null
  let opsError: string | null = null

  try {
    stats = await getAdminStats()
  } catch (e) {
    statsError = e instanceof Error ? e.message : "Failed to load stats"
  }

  try {
    opsData = await getOpsOverview()
  } catch (e) {
    opsError = e instanceof Error ? e.message : "Failed to load ops overview"
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>
        <p className="mt-1 text-muted-foreground">
          Platform administration and merchant management.
        </p>
      </div>

      {statsError && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {statsError}
        </p>
      )}
      {opsError && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {opsError}
        </p>
      )}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Merchants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.merchantsCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.ordersCount}</p>
              {stats.last7DaysOrders > 0 && (
                <p className="text-xs text-muted-foreground">
                  +{stats.last7DaysOrders} in 7 days
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">GMV</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatRupee(stats.gmvTotal)}</p>
              {stats.last7DaysGmv > 0 && (
                <p className="text-xs text-muted-foreground">
                  +{formatRupee(stats.last7DaysGmv)} in 7 days
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatRupee(stats.platformFeesTotal)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Receivable</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatRupee(stats.netReceivable)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatRupee(stats.pendingPayouts)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <SupportOverview />

      {opsData && <OpsOverview data={opsData} />}

      <Card>
        <CardHeader>
          <CardTitle>Quick links</CardTitle>
          <CardDescription>Navigate to main admin sections.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
