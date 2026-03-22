import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface MerchantSummaryTabProps {
  merchant: {
    id: string
    displayName: string
    slug: string
    isActive: boolean
    accountStatus: string
    kycStatus: string
    holdReasonCode: string | null
    holdReasonText: string | null
    holdAppliedAt: Date | null
    kycApprovedAt: Date | null
    createdAt: Date
    customDomain: string | null
    domainStatus: string
  }
  stats: {
    orders: number
    products: number
    payments: number
    gmv: number
  }
}

export function MerchantSummaryTab({ merchant, stats }: MerchantSummaryTabProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge variant={merchant.isActive ? "default" : "secondary"}>
              {merchant.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline">{merchant.accountStatus}</Badge>
            <Badge variant="outline">KYC: {merchant.kycStatus}</Badge>
          </div>
          <p>
            <span className="text-muted-foreground">Slug:</span> {merchant.slug}
          </p>
          <p>
            <span className="text-muted-foreground">Domain:</span>{" "}
            {merchant.customDomain || "—"} ({merchant.domainStatus})
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Orders</p>
            <p className="text-2xl font-semibold">{stats.orders}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Products</p>
            <p className="text-2xl font-semibold">{stats.products}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Payments</p>
            <p className="text-2xl font-semibold">{stats.payments}</p>
          </div>
          <div>
            <p className="text-muted-foreground">GMV (approx)</p>
            <p className="text-2xl font-semibold">₹{stats.gmv.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
