import { notFound } from "next/navigation"
import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { OrderDetailActions } from "@/components/dashboard/OrderDetailActions"
import { formatMoney } from "@/lib/formatMoney"
import { ClientDate } from "@/components/ClientDate"

export default async function OrderDetailPage({
  params,
}: {
  params: { orderId: string }
}) {
  const merchant = await requireMerchant()

  const orderRaw = await prisma.order.findFirst({
    where: {
      id: params.orderId,
      merchantId: merchant.id,
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      },
      payment: true,
      shipments: true,
      refunds: true,
      events: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!orderRaw) {
    notFound()
  }

  const order = {
    ...orderRaw,
    subtotal: orderRaw.subtotal.toNumber(),
    tax: orderRaw.tax.toNumber(),
    shippingFee: orderRaw.shippingFee.toNumber(),
    discount: orderRaw.discount.toNumber(),
    totalAmount: orderRaw.totalAmount.toNumber(),
    grossAmount: orderRaw.grossAmount.toNumber(),
    platformFee: orderRaw.platformFee.toNumber(),
    netPayable: orderRaw.netPayable.toNumber(),
    refunds: orderRaw.refunds.map((r) => ({
      ...r,
      amount: r.amount.toNumber(),
    })),
  }

  const shippingAddress =
    typeof order.shippingAddress === "object" && order.shippingAddress !== null
      ? (order.shippingAddress as any)
      : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            Placed on <ClientDate value={order.createdAt} />
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge>{order.stage}</Badge>
          <span className="text-xs text-muted-foreground">
            Payment: {order.paymentStatus} • Settlement: {order.settlementStatus}
          </span>
          <OrderDetailActions orderId={order.id} currentStage={order.stage} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Order summary */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>Items and charges</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {order.items.map((item) => {
                const productImage = item.product?.images?.[0]
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 border-b pb-3 last:border-0 last:pb-0"
                  >
                    {productImage && (
                      <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted">
                        <Image
                          src={productImage.url}
                          alt={productImage.alt || item.productName || "Product"}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {item.productName || item.product?.name || "Product"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity} • SKU: {item.sku || "-"}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p>₹{formatMoney(item.price / 100)}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{formatMoney(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>₹{formatMoney(order.tax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>₹{formatMoney(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>-₹{formatMoney(order.discount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total</span>
                <span>₹{formatMoney(order.totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer & shipping */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{order.customerName}</p>
              <p className="text-muted-foreground">{order.customerEmail}</p>
              {order.customerPhone && (
                <p className="text-muted-foreground">{order.customerPhone}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              {shippingAddress ? (
                <>
                  {shippingAddress.line1 && <p>{shippingAddress.line1}</p>}
                  {shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
                  <p>
                    {[shippingAddress.city, shippingAddress.state, shippingAddress.postalCode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {shippingAddress.country && <p>{shippingAddress.country}</p>}
                </>
              ) : (
                <p className="text-muted-foreground">
                  {order.customerAddress || "No shipping address available."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment & shipment */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Payment & Settlement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment status</span>
              <span>{order.paymentStatus}</span>
            </div>
            {order.payment && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span>{order.payment.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gateway status</span>
                  <span>{order.payment.status}</span>
                </div>
              </>
            )}
            <div className="flex justify-between pt-2 border-t">
              <span className="text-muted-foreground">Gross amount</span>
              <span>₹{formatMoney(order.grossAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform fee</span>
              <span>-₹{formatMoney(order.platformFee)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Net payable</span>
              <span>₹{formatMoney(order.netPayable)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-muted-foreground">Settlement</span>
              <span>{order.settlementStatus}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {order.shipments.length === 0 ? (
              <p className="text-muted-foreground">
                No shipment information yet. Add courier and AWB from actions above.
              </p>
            ) : (
              order.shipments.map((s) => (
                <div key={s.id} className="border-b pb-2 last:border-0 last:pb-0">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Courier</span>
                    <span>{s.courierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">AWB</span>
                    <span>{s.awb}</span>
                  </div>
                  {s.trackingUrl && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tracking</span>
                      <Link
                        href={s.trackingUrl}
                        target="_blank"
                        className="text-xs text-primary underline"
                      >
                        View
                      </Link>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipped at</span>
                    <span>
                      {s.shippedAt ? <ClientDate value={s.shippedAt} /> : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivered at</span>
                    <span>
                      {s.deliveredAt ? <ClientDate value={s.deliveredAt} /> : "-"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Refunds</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {order.refunds.length === 0 ? (
              <p className="text-muted-foreground">No refunds recorded.</p>
            ) : (
              order.refunds.map((r) => (
                <div key={r.id} className="border-b pb-2 last:border-0 last:pb-0">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span>₹{formatMoney(r.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span>{r.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Reason: {r.reason}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>Activity and audit log for this order</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {order.events.length === 0 ? (
            <p className="text-muted-foreground">No events yet.</p>
          ) : (
            <ul className="space-y-3">
              {order.events.map((event) => (
                <li key={event.id} className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {event.type}
                      </Badge>
                      <span>{event.message}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      By {event.createdBy}
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    <ClientDate value={event.createdAt} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

