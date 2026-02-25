import { redirect } from "next/navigation"
import { requireMerchant } from "@/lib/auth"
import { canUseFeature } from "@/lib/features/canUseFeature"
import { GROWTH_FEATURE_KEYS } from "@/lib/features/featureKeys"
import { ProductImportClient } from "@/components/dashboard/ProductImportClient"

export default async function ProductImportPage() {
  const merchant = await requireMerchant()
  const allowed = await canUseFeature(merchant.id, GROWTH_FEATURE_KEYS.G_BULK_CSV)
  if (!allowed) {
    redirect("/dashboard/upgrade")
  }
  return <ProductImportClient />
}
