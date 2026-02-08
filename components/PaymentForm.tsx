"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Script from "next/script"

interface Order {
  id: string
  orderNumber: string
  items: Array<{
    product: {
      name: string
    }
    quantity: number
    price: number
  }>
}

interface Payment {
  id: string
  amount: number
  paymentMethod: string
  status: string
}

interface PaymentFormProps {
  order: Order
  payment: Payment
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function PaymentForm({ order, payment }: PaymentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Razorpay script will be loaded via Script component
  }, [])

  // Calculate total from items (fallback if payment.amount not available)
  const totalAmount = payment.amount || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  async function handlePayment() {
    if (!window.Razorpay) {
      setError("Payment gateway not loaded. Please refresh the page.")
      return
    }

    if (payment.paymentMethod !== "RAZORPAY") {
      setError("This payment method is not supported for online payment.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create Razorpay order
      const res = await fetch("/api/payments/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create payment order")
      }

      const { razorpayOrderId, amount } = await res.json()

      // Initialize Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount,
        currency: "INR",
        name: "Sellarity",
        description: `Order ${order.orderNumber}`,
        order_id: razorpayOrderId,
        handler: async function (response: any) {
          // Verify payment
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: order.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          })

          if (verifyRes.ok) {
            router.push(`/s/${order.orderNumber}/payment/success`)
            router.refresh()
          } else {
            setError("Payment verification failed")
          }
        },
        prefill: {
          name: "Customer",
          email: "customer@example.com",
        },
        theme: {
          color: "#000000",
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
          <CardDescription>Order #{order.orderNumber}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <span>
                  {item.product.name} × {item.quantity}
                </span>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}

          {payment.paymentMethod === "RAZORPAY" ? (
            <Button
              onClick={handlePayment}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? "Processing..." : `Pay ₹${totalAmount.toFixed(2)}`}
            </Button>
          ) : payment.paymentMethod === "COD" ? (
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="font-semibold">Cash on Delivery</p>
              <p className="text-sm text-muted-foreground">
                Pay when you receive your order
              </p>
            </div>
          ) : (
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="font-semibold">UPI Payment</p>
              <p className="text-sm text-muted-foreground">
                UPI payment integration coming soon
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
