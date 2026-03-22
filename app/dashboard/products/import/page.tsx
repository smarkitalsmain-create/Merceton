import { requireMerchant } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function ProductImportPage() {
  await requireMerchant()

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-3xl font-bold">Import products</h1>
      <p className="text-muted-foreground">
        Bulk CSV import is not wired in this build. Add products manually from the products list.
      </p>
      <Button asChild>
        <Link href="/dashboard/products">Go to products</Link>
      </Button>
    </div>
  )
}
