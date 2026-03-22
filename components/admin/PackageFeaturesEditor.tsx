"use client"

import type { PricingPackageStatus } from "@prisma/client"

export function PackageFeaturesEditor({
  packageId,
  packageStatus,
}: {
  packageId: string
  packageStatus: PricingPackageStatus
}) {
  return (
    <div className="rounded-md border p-4 text-sm text-muted-foreground">
      Feature matrix for package <span className="font-mono">{packageId}</span> ({packageStatus}) is not editable
      in this build.
    </div>
  )
}
