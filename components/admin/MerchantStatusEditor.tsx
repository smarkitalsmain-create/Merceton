"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, AlertTriangle, CheckCircle2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { updateMerchantStatus } from "@/app/actions/merchant-status"
import { MerchantAccountStatus, MerchantKycStatus } from "@prisma/client"
import { HOLD_REASON_CODES, HOLD_REASON_LABELS, requiresNotes } from "@/lib/merchant/holdReasons"

interface MerchantStatusEditorProps {
  merchantId: string
  currentAccountStatus: MerchantAccountStatus
  currentKycStatus: MerchantKycStatus
  currentHoldReasonCode?: string | null
  currentHoldReasonText?: string | null
}

export function MerchantStatusEditor({
  merchantId,
  currentAccountStatus,
  currentKycStatus,
  currentHoldReasonCode,
  currentHoldReasonText,
}: MerchantStatusEditorProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [accountStatus, setAccountStatus] = useState<MerchantAccountStatus>(currentAccountStatus)
  const [kycStatus, setKycStatus] = useState<MerchantKycStatus>(currentKycStatus)
  const [holdReasonCode, setHoldReasonCode] = useState<string | null>(
    currentHoldReasonCode || null
  )
  const [holdReasonText, setHoldReasonText] = useState<string | null>(
    currentHoldReasonText || null
  )
  const [reason, setReason] = useState("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingUpdate, setPendingUpdate] = useState<(() => void) | null>(null)

  const hasChanges =
    accountStatus !== currentAccountStatus ||
    kycStatus !== currentKycStatus ||
    holdReasonCode !== (currentHoldReasonCode || null) ||
    holdReasonText !== (currentHoldReasonText || null)

  const handleSave = () => {
    if (!reason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a reason for this status change.",
        variant: "destructive",
      })
      return
    }

    if (accountStatus === "ON_HOLD" && !holdReasonCode) {
      toast({
        title: "Validation Error",
        description: "Please select a hold reason when setting account to ON_HOLD.",
        variant: "destructive",
      })
      return
    }

    if (holdReasonCode === "OTHER" && !holdReasonText?.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide additional notes for 'Other' hold reason.",
        variant: "destructive",
      })
      return
    }

    setShowConfirmDialog(true)
    setPendingUpdate(() => () => {
      startTransition(async () => {
        try {
          const result = await updateMerchantStatus({
            merchantId,
            accountStatus: accountStatus !== currentAccountStatus ? accountStatus : undefined,
            kycStatus: kycStatus !== currentKycStatus ? kycStatus : undefined,
            holdReasonCode: accountStatus === "ON_HOLD" ? holdReasonCode : null,
            holdReasonText: accountStatus === "ON_HOLD" ? holdReasonText : null,
            reason: reason.trim(),
          })

          if (result.success) {
            toast({
              title: "Status Updated",
              description: "Merchant status has been updated successfully.",
            })
            setReason("")
            // Reload page to show updated status
            window.location.reload()
          } else {
            toast({
              title: "Error",
              description: "Failed to update merchant status.",
              variant: "destructive",
            })
          }
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message || "Failed to update merchant status.",
            variant: "destructive",
          })
        }
      })
    })
  }

  const handleConfirm = () => {
    setShowConfirmDialog(false)
    if (pendingUpdate) {
      pendingUpdate()
      setPendingUpdate(null)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Merchant Status</CardTitle>
          <CardDescription>Update account status and KYC status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="accountStatus">Account Status</Label>
            <Select
              value={accountStatus}
              onValueChange={(value) => setAccountStatus(value as MerchantAccountStatus)}
              disabled={isPending}
            >
              <SelectTrigger id="accountStatus">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {accountStatus === "ON_HOLD" && (
            <div className="space-y-4 rounded-md border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-center gap-2 text-yellow-900">
                <AlertTriangle className="h-4 w-4" />
                <p className="text-sm font-medium">Hold Reason Required</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="holdReasonCode">Hold Reason Code *</Label>
                <Select
                  value={holdReasonCode || ""}
                  onValueChange={(value) => setHoldReasonCode(value)}
                  disabled={isPending}
                >
                  <SelectTrigger id="holdReasonCode">
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
              {(holdReasonCode === "OTHER" || requiresNotes(holdReasonCode)) && (
                <div className="space-y-2">
                  <Label htmlFor="holdReasonText">Additional Notes *</Label>
                  <Textarea
                    id="holdReasonText"
                    value={holdReasonText || ""}
                    onChange={(e) => setHoldReasonText(e.target.value)}
                    disabled={isPending}
                    placeholder="Provide additional details about the hold reason"
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="kycStatus">KYC Status</Label>
            <Select
              value={kycStatus}
              onValueChange={(value) => setKycStatus(value as MerchantKycStatus)}
              disabled={isPending}
            >
              <SelectTrigger id="kycStatus">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">
              Audit Reason * <span className="text-muted-foreground">(required for all changes)</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isPending}
              placeholder="Provide a reason for this status change (required for audit logging)"
              rows={2}
              required
            />
            <p className="text-xs text-muted-foreground">
              This reason will be logged in the audit trail and status history.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isPending || !hasChanges || !reason.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              {isPending ? "Saving..." : "Save Status"}
            </Button>
            {hasChanges && (
              <Button
                variant="outline"
                onClick={() => {
                  setAccountStatus(currentAccountStatus)
                  setKycStatus(currentKycStatus)
                  setHoldReasonCode(currentHoldReasonCode || null)
                  setHoldReasonText(currentHoldReasonText || null)
                  setReason("")
                }}
                disabled={isPending}
              >
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update the merchant status? This action will:
              <ul className="mt-2 list-disc list-inside space-y-1">
                {accountStatus !== currentAccountStatus && (
                  <li>
                    Change account status from <strong>{currentAccountStatus}</strong> to{" "}
                    <strong>{accountStatus}</strong>
                  </li>
                )}
                {kycStatus !== currentKycStatus && (
                  <li>
                    Change KYC status from <strong>{currentKycStatus}</strong> to{" "}
                    <strong>{kycStatus}</strong>
                  </li>
                )}
                {accountStatus === "ON_HOLD" && holdReasonCode && (
                  <li>
                    Set hold reason: <strong>{HOLD_REASON_LABELS[holdReasonCode as keyof typeof HOLD_REASON_LABELS]}</strong>
                  </li>
                )}
                <li>Send email notification to the merchant</li>
                <li>Log this change in the audit trail</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
