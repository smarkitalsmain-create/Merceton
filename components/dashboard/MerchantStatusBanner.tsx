"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Mail, Phone, CheckCircle2 } from "lucide-react"
import { getHoldReasonLabel } from "@/lib/merchant/holdReasons"
import { Badge } from "@/components/ui/badge"

interface MerchantStatusBannerProps {
  accountStatus: "ACTIVE" | "ON_HOLD"
  kycStatus: "PENDING" | "SUBMITTED" | "APPROVED" | "REJECTED"
  holdReasonCode?: string | null
  holdReasonText?: string | null
}

const SUPPORT_EMAIL = "info@smarkitalstech.com"
const SUPPORT_PHONE = "9289109004"
const SUPPORT_HOURS = "Monday to Friday, 10 AM to 7 PM"

export function MerchantStatusBanner({
  accountStatus,
  kycStatus,
  holdReasonCode,
  holdReasonText,
}: MerchantStatusBannerProps) {
  const isOnHold = accountStatus === "ON_HOLD"

  if (!isOnHold && kycStatus === "APPROVED") {
    // Show success message when KYC is approved
    return (
      <Alert variant="default" className="mb-6 border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-900">KYC Approved</AlertTitle>
        <AlertDescription className="text-green-800">
          <p className="font-medium">Your KYC verification has been approved.</p>
          <p className="mt-1 text-sm">
            Your account is fully active and you can start selling on Merceton.
          </p>
        </AlertDescription>
      </Alert>
    )
  }

  if (isOnHold) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Account on Hold</AlertTitle>
        <AlertDescription className="space-y-3">
          <div>
            <p className="font-medium">Your Merceton account is currently on hold.</p>
            {holdReasonCode && (
              <p className="mt-1 text-sm">
                <strong>Reason:</strong> {getHoldReasonLabel(holdReasonCode)}
              </p>
            )}
            {holdReasonText && (
              <p className="mt-1 text-sm">{holdReasonText}</p>
            )}
          </div>

          <div className="rounded-md bg-red-50 p-3 text-sm">
            <p className="font-medium text-red-900 mb-2">What this means:</p>
            <ul className="list-disc list-inside space-y-1 text-red-800">
              <li>You can still view your dashboard, orders, and account information</li>
              <li>Creating new products, publishing products, and requesting payouts are temporarily disabled</li>
              <li>Please contact our support team to resolve this issue</li>
            </ul>
          </div>

          <div className="rounded-md bg-blue-50 p-3 text-sm">
            <p className="font-medium text-blue-900 mb-2">Contact Support:</p>
            <div className="space-y-1 text-blue-800">
              <p className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="underline hover:no-underline"
                >
                  {SUPPORT_EMAIL}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                {SUPPORT_PHONE}
              </p>
              <p className="text-xs text-blue-700 mt-1">Hours: {SUPPORT_HOURS}</p>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // Show KYC status if not approved
  return (
    <div className="mb-4 flex items-center gap-2">
      <Badge variant="default">Account: Active</Badge>
      <Badge
        variant={
          kycStatus === "APPROVED"
            ? "default"
            : kycStatus === "REJECTED"
            ? "destructive"
            : "secondary"
        }
      >
        KYC: {kycStatus}
      </Badge>
    </div>
  )
}
