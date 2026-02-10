export const runtime = "nodejs"

import { requireSuperAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { PricingPackageForm } from "@/components/admin/PricingPackageForm"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function EditPricingPackagePage({
  params,
}: {
  params: { id: string }
}) {
  await requireSuperAdmin()

  const packageData = await prisma.pricingPackage.findUnique({
    where: { id: params.id },
  })

  if (!packageData || packageData.deletedAt) {
    notFound()
  }

  if (packageData.status !== "DRAFT") {
    redirect(`/admin/pricing/${params.id}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={`/admin/pricing/${params.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Package
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Edit Pricing Package</h1>
        <p className="text-muted-foreground">Update DRAFT pricing plan details</p>
      </div>

      <PricingPackageForm initialData={packageData} />
    </div>
  )
}
