export const runtime = "nodejs"

import { requireSuperAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { AdminMerchantsTable } from "@/components/admin/AdminMerchantsTable"

export default async function AdminMerchantsPage({
  searchParams,
}: {
  searchParams?: { search?: string; status?: string }
}) {
  await requireSuperAdmin()

  const where: any = {}
  if (searchParams?.search) {
    where.OR = [
      { displayName: { contains: searchParams.search, mode: "insensitive" } },
      { slug: { contains: searchParams.search, mode: "insensitive" } },
    ]
  }
  if (searchParams?.status === "active") {
    where.isActive = true
  } else if (searchParams?.status === "inactive") {
    where.isActive = false
  }

  const merchants = await prisma.merchant.findMany({
    where,
    select: {
      id: true,
      slug: true,
      displayName: true,
      isActive: true,
      createdAt: true,
      customDomain: true,
      domainStatus: true,
      feeConfig: {
        include: {
          pricingPackage: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      },
      _count: {
        select: {
          orders: true,
          products: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  })

  // Get GMV for each merchant
  const merchantsWithStats = await Promise.all(
    merchants.map(async (merchant) => {
      const gmvResult = await prisma.order.aggregate({
        where: { merchantId: merchant.id },
        _sum: { grossAmount: true },
      })
      return {
        ...merchant,
        gmv: gmvResult._sum.grossAmount?.toNumber() || 0,
      }
    })
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Merchants</h1>
        <p className="text-muted-foreground">Manage all merchants on the platform</p>
      </div>

      <AdminMerchantsTable merchants={merchantsWithStats} />
    </div>
  )
}
