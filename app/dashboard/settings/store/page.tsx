import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMerchantStoreSettings } from "@/app/actions/storeSettings"
import { StoreSettingsForm } from "@/components/settings/StoreSettingsForm"
import { StoreUrlDisplay } from "@/components/settings/StoreUrlDisplay"

export const runtime = "nodejs"

export default async function StoreSettingsPage() {
  const merchant = await requireMerchant()

  // Fetch store settings
  const initialData = await getMerchantStoreSettings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Store Info</h1>
        <p className="text-muted-foreground">
          Manage your store identity, branding, contact information, policies, and operational settings.
        </p>
      </div>

      <div className="space-y-4">
        <StoreUrlDisplay slug={merchant.slug} />
      </div>

      <StoreSettingsForm initialData={initialData} />
    </div>
  )
}
