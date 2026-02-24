import { prisma } from "@/lib/prisma"
import { AdminPricingPackagesTable } from "@/components/admin/AdminPricingPackagesTable"

export default async function AdminPricingPage() {
  // Auth is handled in layout

  const packages = await prisma.pricingPackage.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      _count: {
        select: {
          merchantFeeConfigs: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  const platformSettings = await prisma.platformSettings.findUnique({
    where: { id: "singleton" },
    select: {
      defaultPricingPackageId: true,
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pricing Packages</h1>
          <p className="text-muted-foreground">Manage pricing plans (DRAFT → PUBLISHED → ARCHIVED)</p>
        </div>
      </div>

      <AdminPricingPackagesTable
        packages={packages}
        defaultPackageId={platformSettings?.defaultPricingPackageId || null}
      />
    </div>
  )
}
