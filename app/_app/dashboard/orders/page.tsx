import { requireMerchant } from "@/lib/auth"
import { MerchantOrdersPage } from "@/components/dashboard/MerchantOrdersPage"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function OrdersPage() {
  const merchant = await requireMerchant()

  // Get orders - scoped to merchant.id for tenant isolation
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">Orders</h1>
        <div className="space-y-2 md:space-y-1">
          <p className="text-muted-foreground">
            View and manage customer orders. Export summary or item-level CSV for accounting.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/orders/export">
              <Button variant="outline" size="sm">
                Export Orders (CSV)
              </Button>
            </Link>
            <Link href="/dashboard/orders/export-items">
              <Button variant="outline" size="sm">
                Export Order Items (CSV)
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <MerchantOrdersPage />
    </div>
  )
}
