export const runtime = "nodejs"

import { requireSuperAdmin } from "@/lib/admin-auth"
import { PricingPackageForm } from "@/components/admin/PricingPackageForm"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function NewPricingPackagePage() {
  await requireSuperAdmin()

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/admin/pricing">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Packages
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Create Pricing Package</h1>
        <p className="text-muted-foreground">Create a new pricing plan (will be created as DRAFT)</p>
      </div>

      <PricingPackageForm />
    </div>
  )
}
