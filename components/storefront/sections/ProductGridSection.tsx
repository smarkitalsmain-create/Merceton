import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ProductGridSectionProps {
  storeSlug: string
  title: string
  products: Array<{
    id: string
    name: string
    description: string | null
    price: number
    mrp: number | null
    images: Array<{ url: string; alt: string | null }>
  }>
}

export function ProductGridSection({ storeSlug, title, products }: ProductGridSectionProps) {
  if (!products.length) return null

  return (
    <section className="py-12">
      <div className="container mx-auto px-4 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="text-muted-foreground">
            {products.length} product{products.length !== 1 ? "s" : ""} available
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <Link href={`/s/${storeSlug}/p/${product.id}`}>
                {product.images.length > 0 && (
                  <div className="relative w-full h-64">
                    <Image
                      src={product.images[0].url}
                      alt={product.images[0].alt || product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="line-clamp-2">{product.name}</CardTitle>
                  {product.description && (
                    <CardDescription className="line-clamp-2">
                      {product.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">₹{(product.price / 100).toFixed(2)}</p>
                      {product.mrp && product.mrp > product.price && (
                        <p className="text-sm text-muted-foreground line-through">
                          ₹{(product.mrp / 100).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <Button variant="outline">View Details</Button>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

