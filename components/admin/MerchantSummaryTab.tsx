import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface MerchantSummaryTabProps {
  merchant: {
    id: string
    displayName: string
    slug: string
    isActive: boolean
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
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.products}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total GMV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.gmv.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.payments}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Merchant Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Display Name</label>
            <p className="text-sm">{merchant.displayName}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Slug</label>
            <p className="text-sm">/{merchant.slug}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Status</label>
            <div>
              <Badge variant={merchant.isActive ? "default" : "secondary"}>
                {merchant.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Custom Domain</label>
            <p className="text-sm">
              {merchant.customDomain || "Not configured"}
              {merchant.customDomain && (
                <Badge variant="outline" className="ml-2">
                  {merchant.domainStatus}
                </Badge>
              )}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Created At</label>
            <p className="text-sm">{new Date(merchant.createdAt).toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
