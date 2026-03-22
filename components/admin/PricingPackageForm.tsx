"use client"

import type { PricingPackage } from "@prisma/client"

export function PricingPackageForm({ initialData }: { initialData?: PricingPackage | null }) {
  return (
    <div className="rounded-lg border p-4 space-y-2">
      {initialData ? <p className="font-medium">{initialData.name}</p> : <p className="font-medium">New package</p>}
      <p className="text-sm text-muted-foreground">
        Advanced pricing package editing is not enabled in this build. Manage publish/archive actions from the
        packages list.
      </p>
    </div>
  )
}
