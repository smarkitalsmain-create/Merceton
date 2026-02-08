import { requireMerchant } from "@/lib/auth"
import { NewProductForm } from "@/components/NewProductForm"

export default async function NewProductPage() {
  await requireMerchant()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Product</h1>
        <p className="text-muted-foreground">Create a new product for your store</p>
      </div>
      <NewProductForm />
    </div>
  )
}
