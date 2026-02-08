"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"
import { ShoppingCart, Plus, Minus } from "lucide-react"

interface AddToCartButtonProps {
  product: {
    id: string
    name: string
    price: number
    imageUrl?: string
  }
  storeSlug: string
  maxQuantity: number
}

export function AddToCartButton({ product, storeSlug, maxQuantity }: AddToCartButtonProps) {
  const router = useRouter()
  const { addToCart, cart, updateQuantity, isLoaded } = useCart(storeSlug)
  const { toast } = useToast()
  const [quantity, setQuantity] = useState(1)

  const existingItem = isLoaded ? cart.find((item) => item.productId === product.id) : null
  const currentQuantity = existingItem?.quantity || 0
  const availableQuantity = Math.max(0, maxQuantity - currentQuantity)

  const handleAddToCart = () => {
    if (quantity > availableQuantity) {
      toast({
        title: "Insufficient stock",
        description: `Only ${availableQuantity} items available.`,
        variant: "destructive",
      })
      return
    }

    addToCart(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
      },
      quantity
    )

    toast({
      title: "Added to cart",
      description: `${quantity} × ${product.name} added to cart.`,
    })
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) {
      setQuantity(1)
      return
    }
    if (newQuantity > availableQuantity) {
      setQuantity(availableQuantity)
      return
    }
    setQuantity(newQuantity)
  }

  if (!isLoaded) {
    return <Button disabled className="w-full">Loading...</Button>
  }

  if (availableQuantity <= 0) {
    return <Button disabled className="w-full">Out of Stock</Button>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleQuantityChange(quantity - 1)}
          disabled={quantity <= 1}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          min={1}
          max={availableQuantity}
          value={quantity}
          onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
          className="w-20 text-center"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleQuantityChange(quantity + 1)}
          disabled={quantity >= availableQuantity}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground ml-2">
          {availableQuantity} available
        </span>
      </div>
      <Button onClick={handleAddToCart} className="w-full" size="lg">
        <ShoppingCart className="mr-2 h-5 w-5" />
        Add to Cart
      </Button>
      {existingItem && (
        <p className="text-sm text-muted-foreground">
          {currentQuantity} in cart
        </p>
      )}
    </div>
  )
}
