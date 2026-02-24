import { prisma } from "@/lib/prisma"
import { OrdersTable } from "@/components/admin/OrdersTable"

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: { merchantId?: string; status?: string; from?: string; to?: string }
}) {
  // Auth is handled in layout

  const where: any = {}
  if (searchParams?.merchantId) {
    where.merchantId = searchParams.merchantId
  }
  if (searchParams?.status) {
    where.status = searchParams.status
  }
  if (searchParams?.from || searchParams?.to) {
    where.createdAt = {}
    if (searchParams.from) {
      where.createdAt.gte = new Date(searchParams.from)
    }
    if (searchParams.to) {
      where.createdAt.lte = new Date(searchParams.to)
    }
  }

  const orders = await prisma.order.findMany({
    where,
    select: {
      id: true,
      orderNumber: true,
      merchantId: true,
      status: true,
      grossAmount: true,
      platformFee: true,
      netPayable: true,
      createdAt: true,
      merchant: {
        select: {
          displayName: true,
          slug: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  })

  // Convert Decimal to numbers
  const ordersWithNumbers = orders.map((order) => ({
    ...order,
    grossAmount: order.grossAmount.toNumber(),
    platformFee: order.platformFee.toNumber(),
    netPayable: order.netPayable.toNumber(),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">View and manage all platform orders</p>
      </div>

      <OrdersTable orders={ordersWithNumbers} />
    </div>
  )
}
