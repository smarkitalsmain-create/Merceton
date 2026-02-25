import { requireMerchant } from "@/lib/auth"
import { canUseFeature } from "@/lib/gating/canUse"
import { GROWTH_FEATURE_KEYS } from "@/lib/features/featureKeys"
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard"

export default async function AnalyticsPage() {
  const merchant = await requireMerchant()
  const hasAdvAnalytics = await canUseFeature(merchant.id, GROWTH_FEATURE_KEYS.G_ADV_ANALYTICS)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Track your sales, products, and customer insights
        </p>
      </div>

      <AnalyticsDashboard showAdvanced={hasAdvAnalytics} />
    </div>
  )
}
