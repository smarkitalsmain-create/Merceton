"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
  publishPricingPackage,
  archivePricingPackage,
  togglePricingPackageActive,
  setDefaultPricingPackage,
  duplicatePricingPackage,
} from "@/app/actions/pricing"
import { ConfirmActionDialog } from "@/components/admin/ConfirmActionDialog"
import { useRouter } from "next/navigation"
import { Copy, Send, Archive, CheckCircle2, XCircle, Star } from "lucide-react"

interface PricingPackageActionsProps {
  packageData: {
    id: string
    name: string
    status: string
    isActive: boolean
  }
  isDefault: boolean
  merchantCount: number
}

export function PricingPackageActions({
  packageData,
  isDefault,
  merchantCount,
}: PricingPackageActionsProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dialogState, setDialogState] = useState<{
    open: boolean
    action: string | null
  }>({
    open: false,
    action: null,
  })

  const openDialog = (action: string) => {
    setDialogState({ open: true, action })
  }

  const closeDialog = () => {
    setDialogState({ open: false, action: null })
  }

  const handleConfirm = async (reason: string) => {
    if (!dialogState.action) return

    startTransition(async () => {
      try {
        let result
        switch (dialogState.action) {
          case "publish":
            result = await publishPricingPackage(packageData.id, reason)
            break
          case "archive":
            result = await archivePricingPackage(packageData.id, reason)
            break
          case "toggle":
            result = await togglePricingPackageActive(
              packageData.id,
              !packageData.isActive,
              reason
            )
            break
          case "duplicate":
            result = await duplicatePricingPackage(packageData.id, reason)
            if (result.success) {
              router.push(`/admin/pricing/${result.package.id}/edit`)
              return
            }
            break
          case "setDefault":
            result = await setDefaultPricingPackage(packageData.id, reason)
            break
          default:
            throw new Error("Unknown action")
        }

        if (result.success) {
          toast({
            title: "Success",
            description: getSuccessMessage(dialogState.action),
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

  const getSuccessMessage = (action: string) => {
    switch (action) {
      case "publish":
        return "Package published successfully"
      case "archive":
        return "Package archived successfully"
      case "toggle":
        return `Package ${packageData.isActive ? "deactivated" : "activated"}`
      case "duplicate":
        return "Package duplicated successfully"
      case "setDefault":
        return "Default package updated"
      default:
        return "Action completed"
    }
  }

  const getDialogConfig = () => {
    switch (dialogState.action) {
      case "publish":
        return {
          title: "Publish Package",
          description: `Are you sure you want to publish "${packageData.name}"? This will make it available for assignment to merchants.`,
          confirmLabel: "Publish",
        }
      case "archive":
        return {
          title: "Archive Package",
          description: `Are you sure you want to archive "${packageData.name}"? This will mark it as archived.`,
          confirmLabel: "Archive",
        }
      case "toggle":
        return {
          title: packageData.isActive ? "Deactivate Package" : "Activate Package",
          description: `Are you sure you want to ${packageData.isActive ? "deactivate" : "activate"} "${packageData.name}"?`,
          confirmLabel: packageData.isActive ? "Deactivate" : "Activate",
        }
      case "duplicate":
        return {
          title: "Duplicate Package",
          description: `Create a new DRAFT copy of "${packageData.name}"?`,
          confirmLabel: "Duplicate",
        }
      case "setDefault":
        return {
          title: "Set Default Package",
          description: `Set "${packageData.name}" as the default pricing package for new merchants?`,
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

  return (
    <>
      <div className="flex gap-2">
        {packageData.status === "DRAFT" && (
          <Button
            variant="outline"
            onClick={() => openDialog("publish")}
            disabled={isPending}
          >
            <Send className="h-4 w-4 mr-2" />
            Publish
          </Button>
        )}
        {packageData.status === "PUBLISHED" && (
          <Button
            variant="outline"
            onClick={() => openDialog("archive")}
            disabled={isPending}
          >
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
        )}
        {packageData.status !== "DRAFT" && (
          <Button
            variant="outline"
            onClick={() => openDialog("duplicate")}
            disabled={isPending}
          >
            <Copy className="h-4 w-4 mr-2" />
            Duplicate & Edit
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => openDialog("toggle")}
          disabled={isPending}
        >
          {packageData.isActive ? (
            <>
              <XCircle className="h-4 w-4 mr-2" />
              Deactivate
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Activate
            </>
          )}
        </Button>
        {packageData.status === "PUBLISHED" && !isDefault && (
          <Button
            variant="outline"
            onClick={() => openDialog("setDefault")}
            disabled={isPending}
          >
            <Star className="h-4 w-4 mr-2" />
            Set as Default
          </Button>
        )}
      </div>

      <ConfirmActionDialog
        open={dialogState.open}
        onOpenChange={closeDialog}
        title={getDialogConfig().title}
        description={getDialogConfig().description}
        confirmLabel={getDialogConfig().confirmLabel}
        onConfirm={handleConfirm}
        isLoading={isPending}
      />
    </>
  )
}
