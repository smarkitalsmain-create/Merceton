"use client"

import { useState, useTransition } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  publishPricingPackage,
  archivePricingPackage,
  togglePricingPackageActive,
  deletePricingPackage,
  setDefaultPricingPackage,
  duplicatePricingPackage,
} from "@/app/actions/pricing"
import { ConfirmActionDialog } from "@/components/admin/ConfirmActionDialog"
import Link from "next/link"
import { Edit2, Trash2, Star, CheckCircle2, XCircle, Archive, Send, Copy, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PricingPackage {
  id: string
  name: string
  description: string | null
  status: string
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
  updatedAt: Date
  _count: {
    merchantFeeConfigs: number
  }
}

interface AdminPricingPackagesTableProps {
  packages: PricingPackage[]
  defaultPackageId: string | null
}

export function AdminPricingPackagesTable({
  packages,
  defaultPackageId,
}: AdminPricingPackagesTableProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dialogState, setDialogState] = useState<{
    open: boolean
    action: string | null
    packageId: string | null
    packageName?: string
    currentActive?: boolean
  }>({
    open: false,
    action: null,
    packageId: null,
  })

  const openDialog = (action: string, packageId: string, packageName?: string, currentActive?: boolean) => {
    setDialogState({ open: true, action, packageId, packageName, currentActive })
  }

  const closeDialog = () => {
    setDialogState({ open: false, action: null, packageId: null })
  }

  const handleConfirm = async (reason: string) => {
    const packageId = dialogState.packageId
    const action = dialogState.action
    if (!packageId || !action) return

    startTransition(async () => {
      try {
        let result
        switch (action) {
          case "publish":
            result = await publishPricingPackage(packageId, reason)
            break
          case "archive":
            result = await archivePricingPackage(packageId, reason)
            break
          case "toggle":
            result = await togglePricingPackageActive(
              packageId,
              !dialogState.currentActive,
              reason
            )
            break
          case "delete":
            result = await deletePricingPackage(packageId, reason)
            break
          case "duplicate":
            result = await duplicatePricingPackage(packageId, reason)
            if (result.success) {
              router.push(`/admin/pricing/${result.package.id}/edit`)
              return
            }
            break
          default:
            throw new Error("Unknown action")
        }

        if (result.success) {
          toast({
            title: "Success",
            description: getSuccessMessage(action),
          })
          router.refresh()
          closeDialog()
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Action failed",
          variant: "destructive",
        })
      }
    })
  }

  const handleSetDefault = async (packageId: string) => {
    openDialog("setDefault", packageId)
  }

  const handleSetDefaultConfirm = async (reason: string) => {
    const packageId = dialogState.packageId
    if (!packageId) return

    startTransition(async () => {
      try {
        const result = await setDefaultPricingPackage(packageId, reason)
        if (result.success) {
          toast({ title: "Success", description: "Default package updated" })
          router.refresh()
          closeDialog()
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

  const getSuccessMessage = (action: string) => {
    switch (action) {
      case "publish":
        return "Package published successfully"
      case "archive":
        return "Package archived successfully"
      case "toggle":
        return `Package ${dialogState.currentActive ? "deactivated" : "activated"}`
      case "delete":
        return "Package deleted successfully"
      case "duplicate":
        return "Package duplicated successfully"
      default:
        return "Action completed"
    }
  }

  const getDialogConfig = () => {
    switch (dialogState.action) {
      case "publish":
        return {
          title: "Publish Package",
          description: `Are you sure you want to publish "${dialogState.packageName}"? This will make it available for assignment to merchants.`,
          confirmLabel: "Publish",
        }
      case "archive":
        return {
          title: "Archive Package",
          description: `Are you sure you want to archive "${dialogState.packageName}"? This will mark it as archived.`,
          confirmLabel: "Archive",
        }
      case "toggle":
        return {
          title: dialogState.currentActive ? "Deactivate Package" : "Activate Package",
          description: `Are you sure you want to ${dialogState.currentActive ? "deactivate" : "activate"} "${dialogState.packageName}"?`,
          confirmLabel: dialogState.currentActive ? "Deactivate" : "Activate",
        }
      case "delete":
        return {
          title: "Delete Package",
          description: `Are you sure you want to delete "${dialogState.packageName}"? This action cannot be undone.`,
          confirmLabel: "Delete",
          variant: "destructive" as const,
        }
      case "duplicate":
        return {
          title: "Duplicate Package",
          description: `Create a new DRAFT copy of "${dialogState.packageName}"?`,
          confirmLabel: "Duplicate",
        }
      case "setDefault":
        return {
          title: "Set Default Package",
          description: `Set "${dialogState.packageName}" as the default pricing package for new merchants?`,
          confirmLabel: "Set Default",
        }
      default:
        return {
          title: "Confirm Action",
          description: "Are you sure?",
          confirmLabel: "Confirm",
        }
    }
  }

  const publishedActivePackages = packages.filter(
    (pkg) => pkg.status === "PUBLISHED" && pkg.isActive && pkg.id !== defaultPackageId
  )

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild>
              <Link href="/admin/pricing/new">Create Package (DRAFT)</Link>
            </Button>
            {publishedActivePackages.length > 0 && (
              <Select
                value={defaultPackageId || ""}
                onValueChange={(value) => handleSetDefault(value)}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Set Default Package" />
                </SelectTrigger>
                <SelectContent>
                  {publishedActivePackages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fees</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Payout</TableHead>
                <TableHead>Merchants</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No pricing packages found. Create your first package.
                  </TableCell>
                </TableRow>
              ) : (
                packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">
                      <div>
                        <Link
                          href={`/admin/pricing/${pkg.id}`}
                          className="hover:underline"
                        >
                          {pkg.name}
                        </Link>
                        {pkg.id === defaultPackageId && (
                          <Badge variant="default" className="ml-2">
                            Default
                          </Badge>
                        )}
                      </div>
                      {pkg.description && (
                        <p className="text-xs text-muted-foreground mt-1">{pkg.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          pkg.status === "PUBLISHED"
                            ? "default"
                            : pkg.status === "ARCHIVED"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {pkg.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>
                        ₹{(pkg.fixedFeePaise / 100).toFixed(2)} + {pkg.variableFeeBps / 100}%
                      </div>
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
                    <TableCell className="text-sm">
                      {pkg.payoutFrequency}
                      {pkg.isPayoutHold && (
                        <Badge variant="outline" className="ml-1">
                          Hold
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{pkg._count.merchantFeeConfigs}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/pricing/${pkg.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {pkg.status === "DRAFT" && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/pricing/${pkg.id}/edit`}>
                              <Edit2 className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        {pkg.status !== "DRAFT" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDialog("duplicate", pkg.id, pkg.name)}
                            disabled={isPending}
                            title="Duplicate & Edit"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                        {pkg.status === "DRAFT" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDialog("publish", pkg.id, pkg.name)}
                            disabled={isPending}
                            title="Publish"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        {pkg.status === "PUBLISHED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDialog("archive", pkg.id, pkg.name)}
                            disabled={isPending}
                            title="Archive"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDialog("toggle", pkg.id, pkg.name, pkg.isActive)}
                          disabled={isPending}
                          title={pkg.isActive ? "Deactivate" : "Activate"}
                        >
                          {pkg.isActive ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                        </Button>
                        {pkg.status === "PUBLISHED" && pkg.id !== defaultPackageId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(pkg.id)}
                            disabled={isPending}
                            title="Set as Default"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        {pkg._count.merchantFeeConfigs === 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDialog("delete", pkg.id, pkg.name)}
                            disabled={isPending}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {dialogState.action === "setDefault" ? (
        <ConfirmActionDialog
          open={dialogState.open}
          onOpenChange={closeDialog}
          title={getDialogConfig().title}
          description={getDialogConfig().description}
          confirmLabel={getDialogConfig().confirmLabel}
          onConfirm={handleSetDefaultConfirm}
          isLoading={isPending}
        />
      ) : (
        <ConfirmActionDialog
          open={dialogState.open}
          onOpenChange={closeDialog}
          title={getDialogConfig().title}
          description={getDialogConfig().description}
          confirmLabel={getDialogConfig().confirmLabel}
          variant={getDialogConfig().variant}
          onConfirm={handleConfirm}
          isLoading={isPending}
        />
      )}
    </>
  )
}
