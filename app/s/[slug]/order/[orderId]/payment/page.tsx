import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import PaymentForm from "@/components/PaymentForm"

export default async function PaymentPage({
  params,
}: {
  params: { slug: string; orderId: string }
}) {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: {
      merchant: true,
      items: {
        include: {
          product: true,
        },
      },
      payment: true,
    },
  })

  if (!order || order.merchant.slug !== params.slug) {
    notFound()
  }

  if (order.payment?.status === "PAID") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Your order {order.orderNumber} has been confirmed.
          </p>
        </div>
      </div>
    )
  }

  if (!order.payment) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Complete Payment</h1>
        <PaymentForm order={order} payment={order.payment} />
      </main>
    </div>
  )
}
