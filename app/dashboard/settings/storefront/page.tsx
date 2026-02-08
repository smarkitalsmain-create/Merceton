import { requireMerchant } from "@/lib/auth"
import { StorefrontSettingsForm } from "@/components/StorefrontSettingsForm"

export default async function StorefrontSettingsPage() {
  const merchant = await requireMerchant()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Storefront Settings</h1>
        <p className="text-muted-foreground">
          Configure how your storefront appears to customers
        </p>
      </div>
      <StorefrontSettingsForm merchantId={merchant.id} />
    </div>
  )
}
