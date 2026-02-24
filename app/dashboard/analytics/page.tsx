import { requireMerchant } from "@/lib/auth"
import { assertFeature } from "@/lib/features"
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard"

export default async function AnalyticsPage() {
  const merchant = await requireMerchant()

  // Check feature access
  await assertFeature(merchant.id, "ANALYTICS_BASIC", "/dashboard/analytics")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Track your sales, products, and customer insights
        </p>
      </div>

      <AnalyticsDashboard />
    </div>
  )
}
