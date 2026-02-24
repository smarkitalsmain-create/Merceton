export const runtime = "nodejs"

import { requireSuperAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { DomainsTable } from "@/components/admin/DomainsTable"

export default async function AdminDomainsPage() {
  await requireSuperAdmin()

  const merchants = await prisma.merchant.findMany({
    where: {
      customDomain: { not: null },
    },
    select: {
      id: true,
      displayName: true,
      slug: true,
      customDomain: true,
      domainStatus: true,
      domainVerificationToken: true,
      domainVerifiedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Custom Domains</h1>
        <p className="text-muted-foreground">Manage merchant custom domain configurations</p>
      </div>

      <DomainsTable merchants={merchants} />
    </div>
  )
}
