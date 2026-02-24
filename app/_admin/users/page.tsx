export const runtime = "nodejs"

import { requireSuperAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { UsersTable } from "@/components/admin/UsersTable"

export default async function AdminUsersPage() {
  await requireSuperAdmin()

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      merchantId: true,
      isActive: true,
      createdAt: true,
      merchant: {
        select: {
          id: true,
          displayName: true,
          slug: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage all platform users</p>
      </div>

      <UsersTable users={users} />
    </div>
  )
}
