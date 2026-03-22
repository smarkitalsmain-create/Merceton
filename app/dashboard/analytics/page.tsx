import { requireMerchant } from "@/lib/auth"

export default async function AnalyticsPage() {
  await requireMerchant()

  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-bold">Analytics</h1>
      <p className="text-muted-foreground">Analytics dashboards are not available in this build.</p>
    </div>
  )
}
