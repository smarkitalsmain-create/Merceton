export const runtime = "nodejs"

import { requireSuperAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Edit2, Copy, Send, Archive, CheckCircle2, XCircle, Star, ArrowLeft } from "lucide-react"
import { PricingPackageActions } from "@/components/admin/PricingPackageActions"

export default async function PricingPackageDetailPage({
  params,
}: {
  params: { id: string }
}) {
  await requireSuperAdmin()

  const packageData = await prisma.pricingPackage.findUnique({
    where: { id: params.id },
    include: {
      _count: {
        select: {
          merchantFeeConfigs: true,
        },
      },
    },
  })

  if (!packageData || packageData.deletedAt) {
    notFound()
  }

  const platformSettings = await prisma.platformSettings.findUnique({
    where: { id: "singleton" },
    select: {
      defaultPricingPackageId: true,
    },
  })

  const isDefault = platformSettings?.defaultPricingPackageId === packageData.id

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/admin/pricing">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Packages
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{packageData.name}</h1>
          <p className="text-muted-foreground">
            {packageData.description || "No description"}
          </p>
        </div>
        <div className="flex gap-2">
          {packageData.status === "DRAFT" && (
            <Button asChild>
              <Link href={`/admin/pricing/${packageData.id}/edit`}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          )}
          <PricingPackageActions
            packageData={packageData}
            isDefault={isDefault}
            merchantCount={packageData._count.merchantFeeConfigs}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status & Visibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge
                variant={
                  packageData.status === "PUBLISHED"
                    ? "default"
                    : packageData.status === "ARCHIVED"
                    ? "secondary"
                    : "outline"
                }
              >
                {packageData.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active</span>
              <Badge variant={packageData.isActive ? "default" : "secondary"}>
                {packageData.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Visibility</span>
              <Badge variant={packageData.visibility === "PUBLIC" ? "default" : "secondary"}>
                {packageData.visibility}
              </Badge>
            </div>
            {isDefault && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Default Package</span>
                <Badge variant="default">
                  <Star className="h-3 w-3 mr-1" />
                  Default
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fees</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Fixed Fee</span>
              <span className="font-medium">₹{(packageData.fixedFeePaise / 100).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Variable Fee</span>
              <span className="font-medium">{packageData.variableFeeBps / 100}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Per Order</span>
              <span className="text-xs text-muted-foreground">Fixed + Variable</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Domain</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Domain Included</span>
              <Badge variant={packageData.domainIncluded ? "default" : "secondary"}>
                {packageData.domainIncluded ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Domain Allowed</span>
              <Badge variant={packageData.domainAllowed ? "default" : "secondary"}>
                {packageData.domainAllowed ? "Yes" : "No"}
              </Badge>
            </div>
            {packageData.domainAllowed && !packageData.domainIncluded && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Domain Price</span>
                <span className="font-medium">₹{(packageData.domainPricePaise / 100).toFixed(2)}/mo</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payout Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Frequency</span>
              <span className="font-medium">{packageData.payoutFrequency}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Holdback</span>
              <span className="font-medium">{packageData.holdbackBps / 100}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Payout Hold</span>
              <Badge variant={packageData.isPayoutHold ? "destructive" : "secondary"}>
                {packageData.isPayoutHold ? "Hold Enabled" : "No Hold"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Merchants Using</span>
              <span className="font-medium">{packageData._count.merchantFeeConfigs}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Created: {new Date(packageData.createdAt).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              Updated: {new Date(packageData.updatedAt).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
