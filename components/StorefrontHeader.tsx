"use client"

import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import { Badge } from "@/components/ui/badge"

interface StorefrontHeaderProps {
  storeSlug: string
  storeName: string
  logoUrl?: string | null
}

export function StorefrontHeader({ storeSlug, storeName, logoUrl }: StorefrontHeaderProps) {
  const { getTotalItems, isLoaded } = useCart(storeSlug)
  const itemCount = getTotalItems()

  return (
    <header className="border-b sticky top-0 bg-background z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href={`/s/${storeSlug}`} className="flex items-center gap-3">
            {logoUrl && (
              <img
                src={logoUrl}
                alt={storeName}
                className="h-10 w-10 rounded object-cover"
              />
            )}
            <h1 className="text-2xl font-bold">{storeName}</h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link href={`/s/${storeSlug}/checkout`}>
              <Button variant="outline" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {isLoaded && itemCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
