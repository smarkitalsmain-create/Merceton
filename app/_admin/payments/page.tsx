export const runtime = "nodejs"

import { requirePlatformAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { PaymentsTable } from "@/components/admin/PaymentsTable"

export default async function AdminPaymentsPage() {
  await requirePlatformAdmin()

  const payments = await prisma.payment.findMany({
    select: {
      id: true,
      merchantId: true,
      orderId: true,
      paymentMethod: true,
      status: true,
      razorpayOrderId: true,
      razorpayPaymentId: true,
      amount: true,
      createdAt: true,
      merchant: {
        select: {
          displayName: true,
          slug: true,
        },
      },
      order: {
        select: {
          orderNumber: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  })

  // Convert Decimal to numbers
  const paymentsWithNumbers = payments.map((payment) => ({
    ...payment,
    amount: payment.amount.toNumber(),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payments</h1>
        <p className="text-muted-foreground">View all payment transactions</p>
      </div>

      <PaymentsTable payments={paymentsWithNumbers} />
    </div>
  )
}
