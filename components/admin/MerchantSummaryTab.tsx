"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/formatMoney"
import { ClientDate } from "@/components/ClientDate"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { HOLD_REASON_CODES, HOLD_REASON_LABELS, requiresNotes } from "@/lib/merchant/holdReasons"
import { useToast } from "@/hooks/use-toast"

interface MerchantSummaryTabProps {
  merchant: {
    id: string
    displayName: string
    slug: string
    isActive: boolean
    accountStatus: "ACTIVE" | "ON_HOLD"
    kycStatus: "PENDING" | "SUBMITTED" | "APPROVED" | "REJECTED"
    holdReasonCode: string | null
    holdReasonText: string | null
    holdAppliedAt: Date | null
    kycApprovedAt: Date | null
    createdAt: Date
    customDomain: string | null
    domainStatus: string
  }
  stats: {
    orders: number
    products: number
    payments: number
    gmv: number
  }
}

export function MerchantSummaryTab({ merchant, stats }: MerchantSummaryTabProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [holdDialogOpen, setHoldDialogOpen] = useState(false)
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false)
  const [kycDialogOpen, setKycDialogOpen] = useState(false)
  const [holdReasonCode, setHoldReasonCode] = useState<string>("")
  const [holdReasonText, setHoldReasonText] = useState("")
  const [releaseNotes, setReleaseNotes] = useState("")
  const [kycNote, setKycNote] = useState("")
  const [isPending, startTransition] = useTransition()

  const isOnHold = merchant.accountStatus === "ON_HOLD"
  const isKycApproved = merchant.kycStatus === "APPROVED"
  const holdReasonRequired = requiresNotes(holdReasonCode)

  const handlePutOnHold = () => {
    if (!holdReasonCode) {
      toast({
        title: "Error",
        description: "Please select a reason",
        variant: "destructive",
      })
      return
    }
    if (holdReasonRequired && !holdReasonText.trim()) {
      toast({
        title: "Error",
        description: "Please provide notes when reason is 'Other'",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/merchants/${merchant.id}/hold`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reasonCode: holdReasonCode,
            reasonText: holdReasonText.trim() || undefined,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || "Failed to put merchant on hold")
        }

        toast({
          title: "Success",
          description: "Merchant account put on hold",
        })
        setHoldDialogOpen(false)
        setHoldReasonCode("")
        setHoldReasonText("")
        router.refresh()
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to put merchant on hold",
          variant: "destructive",
        })
      }
    })
  }

  const handleReleaseHold = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/merchants/${merchant.id}/release-hold`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reasonText: releaseNotes.trim() || undefined,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || "Failed to release hold")
        }

        toast({
          title: "Success",
          description: "Merchant account hold released",
        })
        setReleaseDialogOpen(false)
        setReleaseNotes("")
        router.refresh()
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to release hold",
          variant: "destructive",
        })
      }
    })
  }

  const handleApproveKyc = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/merchants/${merchant.id}/kyc/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            note: kycNote.trim() || undefined,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || "Failed to approve KYC")
        }

        toast({
          title: "Success",
          description: "KYC approved",
        })
        setKycDialogOpen(false)
        setKycNote("")
        router.refresh()
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to approve KYC",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.products}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total GMV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{formatMoney(stats.gmv)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.payments}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
          <CardDescription>Manage merchant account status and KYC</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Account Status</Label>
            <div className="mt-1 flex items-center gap-2">
              <Badge
                variant={merchant.accountStatus === "ACTIVE" ? "default" : "destructive"}
              >
                {merchant.accountStatus === "ACTIVE" ? "Active" : "On Hold"}
              </Badge>
              {!isOnHold && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setHoldDialogOpen(true)}
                >
                  Put on Hold
                </Button>
              )}
              {isOnHold && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReleaseDialogOpen(true)}
                >
                  Release Hold
                </Button>
              )}
            </div>
            {isOnHold && merchant.holdReasonCode && (
              <div className="mt-2 text-sm text-muted-foreground">
                <p>
                  <strong>Reason:</strong> {HOLD_REASON_LABELS[merchant.holdReasonCode as keyof typeof HOLD_REASON_LABELS] || merchant.holdReasonCode}
                </p>
                {merchant.holdReasonText && (
                  <p className="mt-1">{merchant.holdReasonText}</p>
                )}
                {merchant.holdAppliedAt && (
                  <p className="mt-1">
                    <strong>Applied:</strong> <ClientDate value={merchant.holdAppliedAt} />
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium">KYC Status</Label>
            <div className="mt-1 flex items-center gap-2">
              <Badge
                variant={
                  merchant.kycStatus === "APPROVED"
                    ? "default"
                    : merchant.kycStatus === "REJECTED"
                    ? "destructive"
                    : "secondary"
                }
              >
                {merchant.kycStatus}
              </Badge>
              {!isKycApproved && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setKycDialogOpen(true)}
                >
                  Approve KYC
                </Button>
              )}
            </div>
            {isKycApproved && merchant.kycApprovedAt && (
              <p className="mt-1 text-sm text-muted-foreground">
                <strong>Approved:</strong> <ClientDate value={merchant.kycApprovedAt} />
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Merchant Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Display Name</Label>
            <p className="text-sm">{merchant.displayName}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Slug</Label>
            <p className="text-sm">/{merchant.slug}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Active Status</Label>
            <div className="mt-1">
              <Badge variant={merchant.isActive ? "default" : "secondary"}>
                {merchant.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Custom Domain</Label>
            <p className="text-sm">
              {merchant.customDomain || "Not configured"}
              {merchant.customDomain && (
                <Badge variant="outline" className="ml-2">
                  {merchant.domainStatus}
                </Badge>
              )}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">Created At</Label>
            <p className="text-sm">
              <ClientDate value={merchant.createdAt} />
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Put on Hold Dialog */}
      <Dialog open={holdDialogOpen} onOpenChange={setHoldDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Put Merchant Account on Hold</DialogTitle>
            <DialogDescription>
              Select a reason for putting this account on hold. The merchant will be notified via email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="hold-reason">Reason *</Label>
              <Select value={holdReasonCode} onValueChange={setHoldReasonCode}>
                <SelectTrigger id="hold-reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {HOLD_REASON_CODES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {HOLD_REASON_LABELS[code]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hold-notes">
                Notes {holdReasonRequired && "*"}
              </Label>
              <Textarea
                id="hold-notes"
                value={holdReasonText}
                onChange={(e) => setHoldReasonText(e.target.value)}
                placeholder={holdReasonRequired ? "Notes are required for 'Other' reason" : "Optional additional notes"}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHoldDialogOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={handlePutOnHold}
              disabled={isPending || !holdReasonCode || (holdReasonRequired && !holdReasonText.trim())}
            >
              {isPending ? "Saving..." : "Put on Hold"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Release Hold Dialog */}
      <Dialog open={releaseDialogOpen} onOpenChange={setReleaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release Merchant Account Hold</DialogTitle>
            <DialogDescription>
              Release the hold on this merchant account. The merchant will be notified via email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="release-notes">Notes (Optional)</Label>
              <Textarea
                id="release-notes"
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                placeholder="Optional notes about releasing the hold"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReleaseDialogOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleReleaseHold} disabled={isPending}>
              {isPending ? "Releasing..." : "Release Hold"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve KYC Dialog */}
      <Dialog open={kycDialogOpen} onOpenChange={setKycDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve KYC</DialogTitle>
            <DialogDescription>
              Approve the merchant&apos;s KYC verification. The merchant will be notified via email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="kyc-note">Note (Optional)</Label>
              <Textarea
                id="kyc-note"
                value={kycNote}
                onChange={(e) => setKycNote(e.target.value)}
                placeholder="Optional note about KYC approval"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKycDialogOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleApproveKyc} disabled={isPending}>
              {isPending ? "Approving..." : "Approve KYC"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
