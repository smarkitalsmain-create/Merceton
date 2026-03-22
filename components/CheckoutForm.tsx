"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"
import {
  checkPincodeServiceability,
  type ServiceabilityResultClient,
  type ServiceabilityStatus,
} from "@/lib/frontend/logistics"
import { cn } from "@/lib/utils"

interface CheckoutFormProps {
  storeSlug: string
  merchantId: string
}

function statusBlocksCheckout(s: ServiceabilityStatus | null): boolean {
  if (s === null) return true
  if (s === "idle" || s === "checking") return true
  return s !== "serviceable"
}

export function CheckoutForm({ storeSlug, merchantId }: CheckoutFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { cart, isLoaded, updateQuantity, removeFromCart, getTotalPrice, clearCart } =
    useCart(storeSlug)

  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [pincode, setPincode] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI" | "RAZORPAY">("COD")

  const [pinStatus, setPinStatus] = useState<ServiceabilityStatus | null>(null)
  const [pinMessage, setPinMessage] = useState<string | null>(null)
  const [isCheckingPin, setIsCheckingPin] = useState(false)

  const [pending, startTransition] = useTransition()

  const debouncedPin = pincode.replace(/\D/g, "").slice(0, 6)

  const runPinCheck = useCallback(async (code: string) => {
    if (code.length !== 6) {
      setPinStatus(null)
      setPinMessage(null)
      return
    }
    setIsCheckingPin(true)
    setPinStatus("checking")
    setPinMessage(null)
    const result: ServiceabilityResultClient = await checkPincodeServiceability(code)
    setPinStatus(result.status)
    setPinMessage(result.message)
    setIsCheckingPin(false)
  }, [])

  useEffect(() => {
    if (debouncedPin.length !== 6) {
      setPinStatus(null)
      setPinMessage(null)
      return
    }
    setPinStatus(null)
    setPinMessage(null)
    const t = setTimeout(() => {
      void runPinCheck(debouncedPin)
    }, 400)
    return () => clearTimeout(t)
  }, [debouncedPin, runPinCheck])

  const checkoutBlocked = useMemo(
    () => statusBlocksCheckout(pinStatus),
    [pinStatus]
  )

  const handlePlaceOrder = () => {
    if (!isLoaded || cart.length === 0) {
      toast({ title: "Cart is empty", variant: "destructive" })
      return
    }
    if (debouncedPin.length !== 6) {
      toast({
        title: "Pincode required",
        description: "Enter a valid 6-digit pincode",
        variant: "destructive",
      })
      return
    }
    if (checkoutBlocked || isCheckingPin) {
      toast({
        title: "Delivery check",
        description: pinMessage || "Confirm delivery to your pincode before placing the order.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/orders/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            merchantId,
            storeSlug,
            items: cart.map((c) => ({
              productId: c.productId,
              quantity: c.quantity,
            })),
            customerName,
            customerEmail,
            customerPhone,
            customerAddress,
            pincode: debouncedPin,
            paymentMethod,
          }),
        })

        const text = await res.text()
        let data: { id?: string; orderNumber?: string; error?: string } = {}
        try {
          data = JSON.parse(text)
        } catch {
          /* ignore */
        }

        if (!res.ok) {
          throw new Error(data.error || "Order failed")
        }

        if (!data.id) {
          throw new Error("Invalid response from server")
        }

        clearCart()
        toast({ title: "Order placed", description: `Order ${data.orderNumber ?? data.id}` })
        router.push(`/s/${storeSlug}/order/${data.id}/payment`)
        router.refresh()
      } catch (e) {
        toast({
          title: "Order failed",
          description: e instanceof Error ? e.message : "Something went wrong",
          variant: "destructive",
        })
      }
    })
  }

  if (!isLoaded) {
    return <p className="text-sm text-muted-foreground">Loading cart…</p>
  }

  if (cart.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center space-y-4">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Button asChild variant="outline">
          <Link href={`/s/${storeSlug}`}>Continue shopping</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Cart</h2>
        <ul className="divide-y rounded-lg border">
          {cart.map((item) => (
            <li key={item.productId} className="flex gap-3 p-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-muted">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  ₹{item.price.toFixed(2)} × {item.quantity}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    className="h-8 w-20"
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateQuantity(item.productId, parseInt(e.target.value, 10) || 1)
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromCart(item.productId)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <p className="text-right text-lg font-semibold">
          Total: ₹{getTotalPrice().toFixed(2)}
        </p>

        <div className="rounded-md border bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Delivery check</p>
          <p className="text-xs text-muted-foreground">
            Enter your delivery pincode below — we&apos;ll verify serviceability automatically.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Shipping &amp; contact</h2>

        <div className="space-y-2">
          <Label htmlFor="pincode">Delivery pincode</Label>
          <Input
            id="pincode"
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit pincode"
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          {debouncedPin.length === 6 && (
            <p
              className={cn(
                "text-xs",
                pinStatus === "serviceable" && "text-green-600 dark:text-green-400",
                (pinStatus === "not_serviceable" ||
                  pinStatus === "temporarily_unavailable" ||
                  pinStatus === "error") &&
                  "text-destructive"
              )}
            >
              {isCheckingPin || pinStatus === "checking"
                ? "Checking…"
                : pinMessage || ""}
            </p>
          )}
          {debouncedPin.length > 0 && debouncedPin.length < 6 && (
            <p className="text-xs text-muted-foreground">Enter a valid 6-digit pincode</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerName">Full name</Label>
          <Input
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerEmail">Email</Label>
          <Input
            id="customerEmail"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerPhone">Phone</Label>
          <Input
            id="customerPhone"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerAddress">Address</Label>
          <Input
            id="customerAddress"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Payment</Label>
          <Select
            value={paymentMethod}
            onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="COD">Cash on delivery</SelectItem>
              <SelectItem value="UPI">UPI</SelectItem>
              <SelectItem value="RAZORPAY">Online (Razorpay)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          className="w-full"
          disabled={
            pending ||
            cart.length === 0 ||
            checkoutBlocked ||
            isCheckingPin ||
            debouncedPin.length !== 6
          }
          onClick={handlePlaceOrder}
        >
          {pending ? "Placing order…" : "Place order"}
        </Button>
      </div>
    </div>
  )
}
