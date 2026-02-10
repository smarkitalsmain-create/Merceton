import { requireMerchant } from "@/lib/auth"
import { MerchantOrdersPage } from "@/components/dashboard/MerchantOrdersPage"

export default async function OrdersPage() {
  const merchant = await requireMerchant()

  // Get orders - scoped to merchant.id for tenant isolation
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">View and manage customer orders</p>
      </div>
      <MerchantOrdersPage />
    </div>
  )
}
