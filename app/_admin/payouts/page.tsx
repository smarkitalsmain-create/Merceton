export const runtime = "nodejs"

import { requireSuperAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { PayoutsTable } from "@/components/admin/PayoutsTable"

export default async function AdminPayoutsPage() {
  await requireSuperAdmin()

  const payouts = await prisma.payoutBatch.findMany({
    select: {
      id: true,
      merchantId: true,
      totalAmount: true,
      status: true,
      processedAt: true,
      createdAt: true,
      razorpayPayoutId: true,
      merchant: {
        select: {
          displayName: true,
          slug: true,
        },
      },
      _count: {
        select: {
          ledgerEntries: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  })

  // Convert Decimal to numbers
  const payoutsWithNumbers = payouts.map((payout) => ({
    ...payout,
    totalAmount: payout.totalAmount.toNumber(),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payouts</h1>
        <p className="text-muted-foreground">View all merchant payouts</p>
      </div>

      <PayoutsTable payouts={payoutsWithNumbers} />
    </div>
  )
}
