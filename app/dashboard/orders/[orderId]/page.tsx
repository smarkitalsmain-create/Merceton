import Link from "next/link"
import { notFound } from "next/navigation"
import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMoney } from "@/lib/formatMoney"

export default async function OrderDetailPage({
  params,
}: {
  params: { orderId: string }
}) {
  const merchant = await requireMerchant()

  const order = await prisma.order.findFirst({
    where: { id: params.orderId, merchantId: merchant.id },
    include: {
      items: true,
      payment: true,
    },
  })

  if (!order) {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Order {order.orderNumber}</h1>
          <p className="text-muted-foreground text-sm">{order.customerEmail}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/orders">All orders</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Status:</span> {order.status}
          </p>
          <p>
            <span className="text-muted-foreground">Payment:</span>{" "}
            {order.payment?.status ?? "—"} ({order.payment?.paymentMethod ?? "—"})
          </p>
          <p>
            <span className="text-muted-foreground">Gross:</span> ₹
            {formatMoney(order.grossAmount.toNumber())}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between border-b pb-2 text-sm">
              <span>{item.productName ?? item.productId}</span>
              <span>
                ×{item.quantity} — ₹{formatMoney((item.price * item.quantity) / 100)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
