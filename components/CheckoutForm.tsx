"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils/currency"
import { createOrder } from "@/app/actions/orders"
import Image from "next/image"
import { Trash2 } from "lucide-react"
import Script from "next/script"

const checkoutSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  customerPhone: z.string().min(10, "Phone number is required").max(15),
  customerAddress: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(6, "Pincode must be 6 digits").max(6),
  paymentMethod: z.enum(["COD", "UPI"], {
    required_error: "Please select a payment method",
  }),
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

interface CheckoutFormProps {
  storeSlug: string
  merchantId: string
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export function CheckoutForm({ storeSlug, merchantId }: CheckoutFormProps) {
  const router = useRouter()
  const { cart, removeFromCart, updateQuantity, getTotalPrice, clearCart, isLoaded } = useCart(storeSlug)
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: "COD",
    },
  })

  const paymentMethod = watch("paymentMethod")

  if (!isLoaded) {
    return <div>Loading cart...</div>
  }

  if (cart.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-lg text-muted-foreground mb-4">Your cart is empty</p>
          <Button asChild>
            <a href={`/s/${storeSlug}`}>Continue Shopping</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const totalPrice = getTotalPrice()

  const handleRazorpayPayment = async (orderId: string) => {
    if (!window.Razorpay) {
      toast({
        title: "Payment gateway not loaded",
        description: "Please refresh the page and try again.",
        variant: "destructive",
      })
      return
    }

    setIsProcessingPayment(true)

    try {
      // Create Razorpay order
      const res = await fetch("/api/payments/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
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
        description: `Order payment`,
        order_id: razorpayOrderId,
        handler: async function (response: any) {
          // Verify payment on server
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          })

          if (verifyRes.ok) {
            clearCart()
            toast({
              title: "Payment successful!",
              description: "Your order has been confirmed.",
            })
            router.push(`/s/${storeSlug}/order/${orderId}`)
          } else {
            const data = await verifyRes.json()
            toast({
              title: "Payment verification failed",
              description: data.error || "Please contact support.",
              variant: "destructive",
            })
          }
        },
        prefill: {
          name: watch("customerName"),
          contact: watch("customerPhone"),
        },
        theme: {
          color: "#000000",
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false)
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.on("payment.failed", function (response: any) {
        toast({
          title: "Payment failed",
          description: response.error.description || "Payment could not be completed.",
          variant: "destructive",
        })
        setIsProcessingPayment(false)
      })
      razorpay.open()
    } catch (error) {
      console.error("Razorpay payment error:", error)
      toast({
        title: "Payment error",
        description: error instanceof Error ? error.message : "Failed to process payment.",
        variant: "destructive",
      })
      setIsProcessingPayment(false)
    }
  }

  const onSubmit = (data: CheckoutFormData) => {
    startTransition(async () => {
      const result = await createOrder({
        merchantId,
        storeSlug,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerAddress: `${data.customerAddress}, ${data.city}, ${data.state} ${data.pincode}`,
        paymentMethod: data.paymentMethod,
      })

      if (result.success && result.order) {
        // For COD, redirect to confirmation
        if (data.paymentMethod === "COD") {
          clearCart()
          toast({
            title: "Order placed successfully!",
            description: `Order ${result.order.orderNumber} has been confirmed.`,
          })
          router.push(`/s/${storeSlug}/order/${result.order.id}`)
        } else {
          // For UPI/online, initiate Razorpay payment
          await handleRazorpayPayment(result.order.id)
        }
      } else {
        toast({
          title: "Order failed",
          description: result.error || "Failed to place order. Please try again.",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
              <CardDescription>Enter your delivery details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Full Name *</Label>
                <Input
                  id="customerName"
                  {...register("customerName")}
                  placeholder="John Doe"
                />
                {errors.customerName && (
                  <p className="text-sm text-destructive">{errors.customerName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  {...register("customerPhone")}
                  placeholder="+91 9876543210"
                />
                {errors.customerPhone && (
                  <p className="text-sm text-destructive">{errors.customerPhone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerAddress">Address *</Label>
                <Textarea
                  id="customerAddress"
                  {...register("customerAddress")}
                  placeholder="Street address, building, apartment"
                  rows={3}
                />
                {errors.customerAddress && (
                  <p className="text-sm text-destructive">{errors.customerAddress.message}</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    {...register("city")}
                    placeholder="Mumbai"
                  />
                  {errors.city && (
                    <p className="text-sm text-destructive">{errors.city.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    {...register("state")}
                    placeholder="Maharashtra"
                  />
                  {errors.state && (
                    <p className="text-sm text-destructive">{errors.state.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    {...register("pincode")}
                    placeholder="400001"
                    maxLength={6}
                  />
                  {errors.pincode && (
                    <p className="text-sm text-destructive">{errors.pincode.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Choose how you want to pay</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => setValue("paymentMethod", value as "COD" | "UPI")}
              >
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <RadioGroupItem value="COD" id="cod" />
                  <Label htmlFor="cod" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">Cash on Delivery (COD)</p>
                      <p className="text-sm text-muted-foreground">Pay when you receive</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <RadioGroupItem value="UPI" id="upi" />
                  <Label htmlFor="upi" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">UPI / Card / Netbanking</p>
                      <p className="text-sm text-muted-foreground">Pay online via Razorpay</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
              {errors.paymentMethod && (
                <p className="text-sm text-destructive mt-2">{errors.paymentMethod.message}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    {item.imageUrl && (
                      <div className="relative h-16 w-16 flex-shrink-0">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{item.price.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 mt-1"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isPending || isProcessingPayment}
              >
                {isProcessingPayment
                  ? "Processing Payment..."
                  : isPending
                  ? "Placing Order..."
                  : paymentMethod === "COD"
                  ? "Place Order (COD)"
                  : "Pay ₹" + totalPrice.toFixed(2)}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </>
  )
}
