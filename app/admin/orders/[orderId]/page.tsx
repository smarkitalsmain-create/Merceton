export const runtime = "nodejs"

import { requireSuperAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function OrderDetailPage({
  params,
}: {
  params: { orderId: string }
}) {
  await requireSuperAdmin()

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: {
      merchant: {
        select: {
          id: true,
          displayName: true,
          slug: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              name: true,
              price: true,
            },
          },
        },
      },
      payment: true,
    },
  })

  if (!order) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/admin/orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Order {order.orderNumber}</h1>
        <p className="text-muted-foreground">Order details and payment information</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Order Number</span>
              <span className="font-medium">{order.orderNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={order.status === "CONFIRMED" ? "default" : "secondary"}>
                {order.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Merchant</span>
              <Link
                href={`/admin/merchants/${order.merchant.id}`}
                className="text-sm font-medium hover:underline"
              >
                {order.merchant.displayName}
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-sm">
                {new Date(order.createdAt).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Gross Amount</span>
              <span className="font-medium">₹{order.grossAmount.toNumber().toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Platform Fee</span>
              <span className="font-medium">₹{order.platformFee.toNumber().toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Net Payable</span>
              <span className="font-medium">₹{order.netPayable.toNumber().toFixed(2)}</span>
            </div>
            {order.payment && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Payment Status</span>
                  <Badge
                    variant={order.payment.status === "PAID" ? "default" : "secondary"}
                  >
                    {order.payment.status}
                  </Badge>
                </div>
                {order.payment.razorpayPaymentId && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Razorpay ID</span>
                    <span className="text-sm font-mono">{order.payment.razorpayPaymentId}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity} × ₹{(item.price / 100).toFixed(2)}
                    </p>
                  </div>
                  <span className="font-medium">
                    ₹{((item.price * item.quantity) / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm">{order.customerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Phone</span>
              <span className="text-sm">{order.customerPhone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Address</span>
              <span className="text-sm text-right max-w-md">{order.customerAddress}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
