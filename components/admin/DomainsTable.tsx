"use client"

import { useState, useTransition } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { markDomainVerified, regenerateDomainToken } from "@/app/actions/admin"
import { CheckCircle2, RefreshCw } from "lucide-react"

interface Merchant {
  id: string
  displayName: string
  slug: string
  customDomain: string | null
  domainStatus: string
  domainVerificationToken: string | null
  domainVerifiedAt: Date | null
}

interface DomainsTableProps {
  merchants: Merchant[]
}

export function DomainsTable({ merchants }: DomainsTableProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const handleMarkVerified = (merchantId: string) => {
    const reason = prompt("Reason for marking domain verified (testing/ops):")
    if (!reason) return

    startTransition(async () => {
      try {
        const result = await markDomainVerified(merchantId, reason)
        if (result.success) {
          toast({
            title: "Success",
            description: "Domain marked as verified (testing only)",
          })
          window.location.reload()
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.message || "Failed to mark domain as verified",
          variant: "destructive",
        })
      }
    })
  }

  const handleRegenerateToken = (merchantId: string) => {
    const reason = prompt("Reason for regenerating verification token:")
    if (!reason) return

    startTransition(async () => {
      try {
        const result = await regenerateDomainToken(merchantId, reason)
        if (result.success) {
          toast({
            title: "Success",
            description: "Domain verification token regenerated",
          })
          window.location.reload()
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.message || "Failed to regenerate token",
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
            <TableHead>Custom Domain</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Verification Token</TableHead>
            <TableHead>Verified At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {merchants.map((merchant) => (
            <TableRow key={merchant.id}>
              <TableCell className="font-medium">{merchant.displayName}</TableCell>
              <TableCell>
                <code className="text-xs bg-muted px-2 py-1 rounded">{merchant.customDomain}</code>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    merchant.domainStatus === "ACTIVE"
                      ? "default"
                      : merchant.domainStatus === "VERIFIED"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {merchant.domainStatus}
                </Badge>
              </TableCell>
              <TableCell className="text-xs font-mono">
                {merchant.domainVerificationToken ? (
                  <code className="bg-muted px-2 py-1 rounded">
                    {merchant.domainVerificationToken.slice(0, 20)}...
                  </code>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell>
                {merchant.domainVerifiedAt
                  ? new Date(merchant.domainVerifiedAt).toLocaleDateString()
                  : "-"}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {merchant.domainStatus !== "VERIFIED" && merchant.domainStatus !== "ACTIVE" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkVerified(merchant.id)}
                      disabled={isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark Verified
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRegenerateToken(merchant.id)}
                    disabled={isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate Token
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
