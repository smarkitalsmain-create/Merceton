"use client"

import { useState, useTransition } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  togglePricingPackageActive,
  deletePricingPackage,
  setDefaultPricingPackage,
} from "@/app/actions/pricing"
import Link from "next/link"
import { Edit2, Trash2, Star, StarOff, CheckCircle2, XCircle } from "lucide-react"
// Note: Super admin check is done server-side

interface PricingPackage {
  id: string
  name: string
  description: string | null
  fixedFeePaise: number
  variableFeeBps: number
  domainPricePaise: number
  domainAllowed: boolean
  domainIncluded: boolean
  payoutFrequency: string
  holdbackBps: number
  isPayoutHold: boolean
  isActive: boolean
  visibility: string
  createdAt: Date
  _count: {
    merchantFeeConfigs: number
  }
}

interface PricingPackagesTableProps {
  packages: PricingPackage[]
  defaultPackageId: string | null
}

export function PricingPackagesTable({
  packages,
  defaultPackageId,
}: PricingPackagesTableProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  // Super admin actions are protected server-side
  const isSuper = true // UI shows buttons, server enforces

  const handleToggleActive = (packageId: string, currentActive: boolean) => {
    const reason = prompt(
      `Reason for ${currentActive ? "deactivating" : "activating"} this package:`
    )
    if (!reason) return

    startTransition(async () => {
      try {
        const result = await togglePricingPackageActive(packageId, !currentActive, reason)
        if (result.success) {
          toast({
            title: "Success",
            description: `Package ${result.package.isActive ? "activated" : "deactivated"}`,
          })
          window.location.reload()
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to update package",
          variant: "destructive",
        })
      }
    })
  }

  const handleDelete = (packageId: string, packageName: string) => {
    if (!confirm(`Delete package "${packageName}"? This cannot be undone.`)) return

    const reason = prompt("Reason for deletion:")
    if (!reason) return

    startTransition(async () => {
      try {
        const result = await deletePricingPackage(packageId, reason)
        if (result.success) {
          toast({
            title: "Success",
            description: "Package deleted",
          })
          window.location.reload()
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to delete package",
          variant: "destructive",
        })
      }
    })
  }

  const handleSetDefault = (packageId: string) => {
    const reason = prompt("Reason for setting as default:")
    if (!reason) return

    startTransition(async () => {
      try {
        const result = await setDefaultPricingPackage(packageId, reason)
        if (result.success) {
          toast({
            title: "Success",
            description: "Default package updated",
          })
          window.location.reload()
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to set default package",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/admin/pricing-packages/new">Create Package</Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Fees</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Payout</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Merchants</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell className="font-medium">
                  <div>
                    {pkg.name}
                    {pkg.id === defaultPackageId && (
                      <Badge variant="default" className="ml-2">
                        Default
                      </Badge>
                    )}
                  </div>
                  {pkg.description && (
                    <p className="text-xs text-muted-foreground">{pkg.description}</p>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  <div>₹{(pkg.fixedFeePaise / 100).toFixed(2)} + {pkg.variableFeeBps / 100}%</div>
                </TableCell>
                <TableCell className="text-sm">
                  {pkg.domainIncluded ? (
                    <Badge variant="default">Included</Badge>
                  ) : pkg.domainAllowed ? (
                    <div>₹{(pkg.domainPricePaise / 100).toFixed(2)}/mo</div>
                  ) : (
                    <span className="text-muted-foreground">Not available</span>
                  )}
                </TableCell>
                <TableCell className="text-sm">{pkg.payoutFrequency}</TableCell>
                <TableCell>
                  <Badge variant={pkg.visibility === "PUBLIC" ? "default" : "secondary"}>
                    {pkg.visibility}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={pkg.isActive ? "default" : "secondary"}>
                    {pkg.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>{pkg._count.merchantFeeConfigs}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/pricing-packages/${pkg.id}/edit`}>
                        <Edit2 className="h-4 w-4" />
                      </Link>
                    </Button>
                    {isSuper && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(pkg.id, pkg.isActive)}
                          disabled={isPending}
                        >
                          {pkg.isActive ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                        </Button>
                        {pkg.id !== defaultPackageId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(pkg.id)}
                            disabled={isPending}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        {pkg._count.merchantFeeConfigs === 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(pkg.id, pkg.name)}
                            disabled={isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
