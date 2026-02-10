"use client"

import { useState, useTransition } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { toggleMerchantStatus, resetDomainStatus, updateMerchantFeeConfig } from "@/app/actions/admin"
import { RefreshCw, CheckCircle2, XCircle } from "lucide-react"
import { formatMoney } from "@/lib/formatMoney"
import { ClientDate } from "@/components/ClientDate"

interface Merchant {
  id: string
  slug: string
  displayName: string
  isActive: boolean
  createdAt: Date
  customDomain: string | null
  domainStatus: string
  feePercentageBps: number | null
  feeFlatPaise: number | null
  feeMaxCapPaise: number | null
}

interface MerchantsTableProps {
  merchants: Merchant[]
}

export function MerchantsTable({ merchants }: MerchantsTableProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const handleToggleStatus = (merchantId: string, currentStatus: boolean) => {
    const reason = prompt(
      `Reason for ${currentStatus ? "deactivating" : "activating"} this merchant:`
    )
    if (!reason) return

    startTransition(async () => {
      try {
        const result = await toggleMerchantStatus(merchantId, !currentStatus, reason)
        if (result.success) {
          toast({
            title: "Success",
            description: `Merchant ${result.merchant.isActive ? "activated" : "deactivated"}`,
          })
          window.location.reload()
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.message || "Failed to update merchant status",
          variant: "destructive",
        })
      }
    })
  }

  const handleResetDomain = (merchantId: string) => {
    const reason = prompt("Reason for resetting domain status/token:")
    if (!reason) return

    startTransition(async () => {
      try {
        const result = await resetDomainStatus(merchantId, reason)
        if (result.success) {
          toast({
            title: "Success",
            description: "Domain status reset and token regenerated",
          })
          window.location.reload()
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.message || "Failed to reset domain",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Merchant</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Custom Domain</TableHead>
            <TableHead>Domain Status</TableHead>
            <TableHead>Fee Config</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {merchants.map((merchant) => (
            <TableRow key={merchant.id}>
              <TableCell className="font-medium">{merchant.displayName}</TableCell>
              <TableCell>
                <code className="text-xs bg-muted px-2 py-1 rounded">/{merchant.slug}</code>
              </TableCell>
              <TableCell>
                <Badge variant={merchant.isActive ? "default" : "secondary"}>
                  {merchant.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>{merchant.customDomain || "-"}</TableCell>
              <TableCell>
                {merchant.customDomain && (
                  <Badge variant="outline">{merchant.domainStatus}</Badge>
                )}
              </TableCell>
              <TableCell className="text-xs">
                {merchant.feePercentageBps ? `${merchant.feePercentageBps / 100}%` : "Default"}{" "}
                {merchant.feeFlatPaise && `+ ₹${formatMoney(merchant.feeFlatPaise / 100)}`}
                {merchant.feeMaxCapPaise &&
                  ` (max ₹${formatMoney(merchant.feeMaxCapPaise / 100)})`}
              </TableCell>
              <TableCell>
                <ClientDate value={merchant.createdAt} />
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(merchant.id, merchant.isActive)}
                    disabled={isPending}
                  >
                    {merchant.isActive ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </Button>
                  {merchant.customDomain && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResetDomain(merchant.id)}
                      disabled={isPending}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
