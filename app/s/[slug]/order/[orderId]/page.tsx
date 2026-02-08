import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StorefrontHeader } from "@/components/StorefrontHeader"
import { CheckCircle } from "lucide-react"
import Link from "next/link"

export default async function OrderConfirmationPage({
  params,
}: {
  params: { slug: string; orderId: string }
}) {
  const merchant = await prisma.merchant.findUnique({
    where: { slug: params.slug, isActive: true },
    include: {
      storefront: true,
    },
  })

  if (!merchant) {
    notFound()
  }

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      payment: true,
    },
  })

  if (!order || order.merchantId !== merchant.id) {
    notFound()
  }

  const totalAmount = order.items.reduce(
    (sum, item) => sum + (item.price * item.quantity),
    0
  )

  return (
    <div className="min-h-screen bg-background">
      <StorefrontHeader
        storeSlug={merchant.slug}
        storeName={merchant.displayName}
        logoUrl={merchant.storefront?.logoUrl}
      />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
                <p className="text-muted-foreground">
                  Your order has been placed successfully
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
              <CardDescription>Order #{order.orderNumber}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order Number</p>
                  <p className="font-semibold">{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order Date</p>
                  <p className="font-semibold">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="font-semibold capitalize">{order.status.toLowerCase()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                  <p className="font-semibold">{order.payment?.paymentMethod || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity} × ₹{(item.price / 100).toFixed(2)}
                      </p>
                    </div>
                    <p className="font-semibold">
                      ₹{((item.price * item.quantity) / 100).toFixed(2)}
                    </p>
                  </div>
                ))}
                <div className="border-t pt-4 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>₹{(totalAmount / 100).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="font-medium">{order.customerName}</p>
                <p className="text-muted-foreground">{order.customerAddress}</p>
                {order.customerPhone && (
                  <p className="text-muted-foreground">Phone: {order.customerPhone}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button asChild variant="outline" className="flex-1">
              <Link href={`/s/${params.slug}`}>Continue Shopping</Link>
            </Button>
            {order.payment?.paymentMethod === "COD" && (
              <p className="text-sm text-muted-foreground flex items-center">
                You will pay ₹{(totalAmount / 100).toFixed(2)} when you receive your order.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
