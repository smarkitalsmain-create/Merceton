import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, paiseToInr } from "@/lib/utils/currency"

// Badge component for order status
function OrderStatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PLACED: "bg-blue-100 text-blue-800",
    CONFIRMED: "bg-green-100 text-green-800",
    PROCESSING: "bg-purple-100 text-purple-800",
    SHIPPED: "bg-indigo-100 text-indigo-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${variants[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  )
}

export default async function OrdersPage() {
  const merchant = await requireMerchant()

  // Get orders - scoped to merchant.id for tenant isolation
  const ordersRaw = await prisma.order.findMany({
    where: { merchantId: merchant.id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      payment: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50, // Limit for MVP
  })

  // Convert Decimal fields to numbers at data boundary
  const orders = ordersRaw.map((order) => ({
    ...order,
    grossAmount: order.grossAmount.toNumber(),
    platformFee: order.platformFee.toNumber(),
    netPayable: order.netPayable.toNumber(),
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">View and manage customer orders</p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No orders yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Order {order.orderNumber}</CardTitle>
                    <CardDescription>
                      {order.customerName} • {order.customerEmail}
                    </CardDescription>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Items:</span>
                      <span>
                        {order.items.map((item) => (
                          <span key={item.id} className="ml-2">
                            {item.product.name} × {item.quantity}
                          </span>
                        ))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment:</span>
                      <span>
                        {order.payment ? (
                          <>
                            <span className="capitalize">{order.payment.paymentMethod.toLowerCase()}</span>
                            {" • "}
                            <span className={order.payment.status === "PAID" ? "text-green-600" : ""}>
                              {order.payment.status}
                            </span>
                          </>
                        ) : (
                          "N/A"
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Gross Amount:</span>
                      <span className="font-medium">₹{order.grossAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Platform Fee:</span>
                      <span className="font-medium text-red-600">-₹{order.platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold border-t pt-2">
                      <span>Net Payable:</span>
                      <span className="text-green-600">₹{order.netPayable.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
