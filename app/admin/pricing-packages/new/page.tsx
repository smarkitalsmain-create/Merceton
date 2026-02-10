export const runtime = "nodejs"

import { requireSuperAdmin } from "@/lib/admin-auth"
import { PricingPackageForm } from "@/components/admin/PricingPackageForm"

export default async function NewPricingPackagePage() {
  await requireSuperAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Pricing Package</h1>
        <p className="text-muted-foreground">Create a new pricing plan (will be created as DRAFT)</p>
      </div>

      <PricingPackageForm />
    </div>
  )
}
