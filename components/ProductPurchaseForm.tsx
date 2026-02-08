"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { paiseToInr } from "@/lib/utils/currency"

interface ProductPurchaseFormProps {
  productId: string
  productName: string
  productPrice: number
  storeSlug: string
}

export default function ProductPurchaseForm({
  productId,
  productName,
  productPrice,
  storeSlug,
}: ProductPurchaseFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const customerName = formData.get("customerName") as string
    const customerEmail = formData.get("customerEmail") as string
    const customerPhone = formData.get("customerPhone") as string
    const customerAddress = formData.get("customerAddress") as string
    const quantity = parseInt(formData.get("quantity") as string)

    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          storeSlug,
          customerName,
          customerEmail,
          customerPhone,
          customerAddress,
          quantity,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create order")
      }

      const data = await res.json()
      // Redirect to payment page
      router.push(`/s/${storeSlug}/order/${data.order.id}/payment`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity</Label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min="1"
          defaultValue="1"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="customerName">Full Name</Label>
        <Input
          id="customerName"
          name="customerName"
          required
          placeholder="John Doe"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="customerEmail">Email</Label>
        <Input
          id="customerEmail"
          name="customerEmail"
          type="email"
          required
          placeholder="john@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="customerPhone">Phone</Label>
        <Input
          id="customerPhone"
          name="customerPhone"
          type="tel"
          required
          placeholder="+91 9876543210"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="customerAddress">Delivery Address</Label>
        <Input
          id="customerAddress"
          name="customerAddress"
          required
          placeholder="123 Main St, City, State, PIN"
        />
      </div>

      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Processing..." : `Buy Now - ₹${productPrice.toFixed(2)}`}
      </Button>
    </form>
  )
}
