"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"
import { PincodeServiceabilityChecker } from "@/components/logistics/PincodeServiceabilityChecker"
import Link from "next/link"

interface StorefrontBuyBoxProps {
  storeSlug: string
  productId: string
  productName: string
  /** unit price in paise */
  pricePaise: number
  imageUrl?: string | null
  inStock: boolean
}

export function StorefrontBuyBox({
  storeSlug,
  productId,
  productName,
  pricePaise,
  imageUrl,
  inStock,
}: StorefrontBuyBoxProps) {
  const { addToCart } = useCart(storeSlug)
  const { toast } = useToast()
  const [qty, setQty] = useState(1)

  const unitInr = pricePaise / 100

  const handleAddToCart = () => {
    if (!inStock) return
    addToCart(
      {
        productId,
        name: productName,
        price: unitInr,
        imageUrl: imageUrl ?? undefined,
      },
      qty
    )
    toast({
      title: "Added to cart",
      description: `${productName} × ${qty}`,
    })
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="qty">Quantity</Label>
          <Input
            id="qty"
            type="number"
            min={1}
            className="w-24"
            value={qty}
            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
            disabled={!inStock}
          />
        </div>
        <Button type="button" className="flex-1 min-w-[140px]" disabled={!inStock} onClick={handleAddToCart}>
          Add to cart
        </Button>
        <Button type="button" variant="secondary" asChild className="flex-1 min-w-[140px]">
          <Link href={`/s/${storeSlug}/checkout`}>Continue to checkout</Link>
        </Button>
      </div>

      <PincodeServiceabilityChecker
        label="Check delivery to your pincode"
        helperText="Enter your 6-digit pincode to see if we deliver to your area."
      />
    </div>
  )
}
