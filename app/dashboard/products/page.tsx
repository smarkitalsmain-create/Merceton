import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { formatCurrency, paiseToInr } from "@/lib/utils/currency"
import { Package, Plus, Search } from "lucide-react"
import { ProductsList } from "@/components/ProductsList"

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string }
}) {
  const merchant = await requireMerchant()

  // Build where clause with tenant isolation
  const where: any = {
    merchantId: merchant.id, // CRITICAL: Tenant isolation
  }

  // Search filter
  if (searchParams.search) {
    where.OR = [
      { name: { contains: searchParams.search, mode: "insensitive" } },
      { description: { contains: searchParams.search, mode: "insensitive" } },
      { sku: { contains: searchParams.search, mode: "insensitive" } },
    ]
  }

  // Status filter
  if (searchParams.status === "in-stock") {
    where.stock = { gt: 0 }
  } else if (searchParams.status === "out-of-stock") {
    where.stock = { lte: 0 }
  }

  // Get products
  const products = await prisma.product.findMany({
    where,
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/products/import">
              <Package className="mr-2 h-4 w-4" />
              Import CSV
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      <ProductsList initialProducts={products} searchParams={searchParams} />
    </div>
  )
}
