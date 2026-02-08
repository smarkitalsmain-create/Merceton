"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { formatCurrency } from "@/lib/utils/currency"
import { Package, Edit, Trash2, Search } from "lucide-react"
import { deleteProduct } from "@/app/actions/products"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  mrp: number | null
  sku: string | null
  stock: number
  isActive: boolean
  images: Array<{
    url: string
    alt: string | null
  }>
}

interface ProductsListProps {
  initialProducts: Product[]
  searchParams: { search?: string; status?: string }
}

export function ProductsList({ initialProducts, searchParams }: ProductsListProps) {
  const router = useRouter()
  const currentSearchParams = useSearchParams()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(searchParams.search || "")
  const [status, setStatus] = useState(searchParams.status || "all")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (status !== "all") params.set("status", status)
    router.push(`/dashboard/products?${params.toString()}`)
  }

  const handleStatusChange = (value: string) => {
    setStatus(value)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (value !== "all") params.set("status", value)
    router.push(`/dashboard/products?${params.toString()}`)
  }

  const handleDelete = (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) {
      return
    }

    startTransition(async () => {
      const result = await deleteProduct(productId)
      if (result.success) {
        toast({
          title: "Product deleted",
          description: `${productName} has been deleted.`,
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete product",
          variant: "destructive",
        })
      }
    })
  }

  if (initialProducts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No products found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchParams.search || searchParams.status
              ? "Try adjusting your search or filters"
              : "Get started by adding your first product"}
          </p>
          {!searchParams.search && !searchParams.status && (
            <Button asChild>
              <Link href="/dashboard/products/new">Add Product</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={isPending}>
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {initialProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            {product.images.length > 0 && (
              <div className="relative w-full h-48">
                <Image
                  src={product.images[0].url}
                  alt={product.images[0].alt || product.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                    {product.sku && (
                      <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                    )}
                  </div>
                  {!product.isActive && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{formatCurrency(product.price)}</span>
                  {product.mrp && product.mrp > product.price && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatCurrency(product.mrp)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <Badge
                    variant={product.stock > 0 ? "default" : "destructive"}
                  >
                    {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                    >
                      <Link href={`/dashboard/products/${product.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(product.id, product.name)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
