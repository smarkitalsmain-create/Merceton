"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink } from "lucide-react"
import { ClientDate } from "@/components/ClientDate"

interface MerchantOnboardingTabProps {
  merchantId: string
  onboarding: {
    onboardingStatus: string
    completedAt: Date | null
    profileCompletionPercent: number | null
    // PAN Details
    panType: string | null
    panNumber: string | null
    panName: string | null
    panDobOrIncorp: Date | null
    panHolderRole: string | null
    // Note: panVerifiedAt doesn't exist in schema
    // GST Details
    gstStatus: string
    gstin: string | null
    gstLegalName: string | null
    gstTradeName: string | null
    gstState: string | null
    gstComposition: boolean
    gstNotRegisteredReason: string | null
    // Invoice/Billing Address (mapped from contact* for display)
    contactEmail: string | null // Maps to invoiceEmail
    contactPhone: string | null // Maps to invoicePhone
    websiteUrl: string | null // Field doesn't exist in schema
    contactAddressLine1: string | null // Maps to invoiceAddressLine1
    contactAddressLine2: string | null // Maps to invoiceAddressLine2
    contactCity: string | null // Maps to invoiceCity
    contactState: string | null // Maps to invoiceState
    contactPincode: string | null // Maps to invoicePincode
    // Business Basics
    storeDisplayName: string | null
    legalBusinessName: string | null
    yearStarted: number | null
    businessType: string | null
    primaryCategory: string | null
    secondaryCategory: string | null
    createdAt: Date
    updatedAt: Date
  } | null
  bankAccount: {
    accountHolderName: string
    bankName: string
    accountNumber: string
    ifscCode: string
    accountType: string
    verificationStatus: string
  } | null
}

function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber || accountNumber.length < 4) return "****"
  const last4 = accountNumber.slice(-4)
  return `****${last4}`
}

export function MerchantOnboardingTab({
  merchantId,
  onboarding,
  bankAccount,
}: MerchantOnboardingTabProps) {
  const handleDownloadLedger = async () => {
    try {
      const url = `/api/admin/merchants/${merchantId}/ledger`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Failed to download ledger")
      }
      const blob = await response.blob()
      const contentDisposition = response.headers.get("Content-Disposition")
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch
        ? filenameMatch[1]
        : `merchant-ledger-${merchantId}-${new Date().toISOString().slice(0, 10)}.csv`

      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error("Error downloading ledger:", error)
      alert("Failed to download ledger. Please try again.")
    }
  }

  if (!onboarding) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <p>No onboarding data available for this merchant.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Download Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Onboarding Details</h2>
          <p className="text-muted-foreground">Merchant onboarding information and compliance data</p>
        </div>
        <Button onClick={handleDownloadLedger} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download Ledger (CSV)
        </Button>
      </div>

      {/* Onboarding Status */}
      <Card>
        <CardHeader>
          <CardTitle>Onboarding Status</CardTitle>
          <CardDescription>Current onboarding progress and completion</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Status</label>
            <div>
              <Badge
                variant={
                  onboarding.onboardingStatus === "COMPLETED"
                    ? "default"
                    : onboarding.onboardingStatus === "IN_PROGRESS"
                    ? "secondary"
                    : "outline"
                }
              >
                {onboarding.onboardingStatus}
              </Badge>
            </div>
          </div>
          {onboarding.profileCompletionPercent !== null && (
            <div>
              <label className="text-sm font-medium">Profile Completion</label>
              <div className="text-sm">{onboarding.profileCompletionPercent}%</div>
            </div>
          )}
          {onboarding.completedAt && (
            <div>
              <label className="text-sm font-medium">Completed At</label>
              <div className="text-sm">
                <ClientDate value={onboarding.completedAt} />
              </div>
            </div>
          )}
          <div>
            <label className="text-sm font-medium">Last Updated</label>
            <div className="text-sm">
              <ClientDate value={onboarding.updatedAt} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Details */}
      <Card>
        <CardHeader>
          <CardTitle>Business Details</CardTitle>
          <CardDescription>Legal business information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {onboarding.storeDisplayName && (
            <div>
              <label className="text-sm font-medium">Store Display Name</label>
              <div className="text-sm">{onboarding.storeDisplayName}</div>
            </div>
          )}
          {onboarding.legalBusinessName && (
            <div>
              <label className="text-sm font-medium">Legal Business Name</label>
              <div className="text-sm">{onboarding.legalBusinessName}</div>
            </div>
          )}
          {onboarding.businessType && (
            <div>
              <label className="text-sm font-medium">Business Type</label>
              <div className="text-sm">{onboarding.businessType}</div>
            </div>
          )}
          {onboarding.primaryCategory && (
            <div>
              <label className="text-sm font-medium">Primary Category</label>
              <div className="text-sm">{onboarding.primaryCategory}</div>
            </div>
          )}
          {onboarding.secondaryCategory && (
            <div>
              <label className="text-sm font-medium">Secondary Category</label>
              <div className="text-sm">{onboarding.secondaryCategory}</div>
            </div>
          )}
          {onboarding.yearStarted && (
            <div>
              <label className="text-sm font-medium">Year Started</label>
              <div className="text-sm">{onboarding.yearStarted}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PAN Details */}
      <Card>
        <CardHeader>
          <CardTitle>PAN Details</CardTitle>
          <CardDescription>Permanent Account Number information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {onboarding.panNumber && (
            <div>
              <label className="text-sm font-medium">PAN Number</label>
              <div className="text-sm font-mono">{onboarding.panNumber}</div>
            </div>
          )}
          {onboarding.panName && (
            <div>
              <label className="text-sm font-medium">Name as per PAN</label>
              <div className="text-sm">{onboarding.panName}</div>
            </div>
          )}
          {onboarding.panType && (
            <div>
              <label className="text-sm font-medium">PAN Type</label>
              <div className="text-sm">{onboarding.panType}</div>
            </div>
          )}
          {onboarding.panDobOrIncorp && (
            <div>
              <label className="text-sm font-medium">
                {onboarding.panType === "INDIVIDUAL" ? "Date of Birth" : "Incorporation Date"}
              </label>
              <div className="text-sm">
                <ClientDate value={onboarding.panDobOrIncorp} />
              </div>
            </div>
          )}
          {onboarding.panHolderRole && (
            <div>
              <label className="text-sm font-medium">PAN Holder Role</label>
              <div className="text-sm">{onboarding.panHolderRole}</div>
            </div>
          )}
          {/* Note: panVerifiedAt field doesn't exist in schema */}
        </CardContent>
      </Card>

      {/* GST Details */}
      <Card>
        <CardHeader>
          <CardTitle>GST Details</CardTitle>
          <CardDescription>GST registration and compliance information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">GST Status</label>
            <div>
              <Badge
                variant={
                  onboarding.gstStatus === "REGISTERED"
                    ? "default"
                    : onboarding.gstStatus === "APPLIED"
                    ? "secondary"
                    : "outline"
                }
              >
                {onboarding.gstStatus}
              </Badge>
            </div>
          </div>
          {onboarding.gstin && (
            <div>
              <label className="text-sm font-medium">GSTIN</label>
              <div className="text-sm font-mono">{onboarding.gstin}</div>
            </div>
          )}
          {onboarding.gstLegalName && (
            <div>
              <label className="text-sm font-medium">Legal Name (as per GST)</label>
              <div className="text-sm">{onboarding.gstLegalName}</div>
            </div>
          )}
          {onboarding.gstTradeName && (
            <div>
              <label className="text-sm font-medium">Trade Name</label>
              <div className="text-sm">{onboarding.gstTradeName}</div>
            </div>
          )}
          {onboarding.gstState && (
            <div>
              <label className="text-sm font-medium">State</label>
              <div className="text-sm">{onboarding.gstState}</div>
            </div>
          )}
          {onboarding.gstComposition && (
            <div>
              <label className="text-sm font-medium">Composition Scheme</label>
              <div className="text-sm">{onboarding.gstComposition ? "Yes" : "No"}</div>
            </div>
          )}
          {onboarding.gstNotRegisteredReason && (
            <div>
              <label className="text-sm font-medium">Reason for Not Registering</label>
              <div className="text-sm">{onboarding.gstNotRegisteredReason}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Business contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {onboarding.contactEmail && (
            <div>
              <label className="text-sm font-medium">Email</label>
              <div className="text-sm">{onboarding.contactEmail}</div>
            </div>
          )}
          {onboarding.contactPhone && (
            <div>
              <label className="text-sm font-medium">Phone</label>
              <div className="text-sm">{onboarding.contactPhone}</div>
            </div>
          )}
          {onboarding.websiteUrl && (
            <div>
              <label className="text-sm font-medium">Website</label>
              <div className="text-sm">
                <a
                  href={onboarding.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  {onboarding.websiteUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
          {(onboarding.contactAddressLine1 ||
            onboarding.contactAddressLine2 ||
            onboarding.contactCity ||
            onboarding.contactState ||
            onboarding.contactPincode) && (
            <div>
              <label className="text-sm font-medium">Address</label>
              <div className="text-sm space-y-1">
                {onboarding.contactAddressLine1 && <div>{onboarding.contactAddressLine1}</div>}
                {onboarding.contactAddressLine2 && <div>{onboarding.contactAddressLine2}</div>}
                <div>
                  {[
                    onboarding.contactCity,
                    onboarding.contactState,
                    onboarding.contactPincode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Details */}
      {bankAccount && (
        <Card>
          <CardHeader>
            <CardTitle>Bank Account Details</CardTitle>
            <CardDescription>Merchant bank account information (masked for security)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Account Holder Name</label>
              <div className="text-sm">{bankAccount.accountHolderName}</div>
            </div>
            <div>
              <label className="text-sm font-medium">Bank Name</label>
              <div className="text-sm">{bankAccount.bankName}</div>
            </div>
            <div>
              <label className="text-sm font-medium">Account Number</label>
              <div className="text-sm font-mono">{maskAccountNumber(bankAccount.accountNumber)}</div>
            </div>
            <div>
              <label className="text-sm font-medium">IFSC Code</label>
              <div className="text-sm font-mono">{bankAccount.ifscCode}</div>
            </div>
            <div>
              <label className="text-sm font-medium">Account Type</label>
              <div className="text-sm">{bankAccount.accountType}</div>
            </div>
            <div>
              <label className="text-sm font-medium">Verification Status</label>
              <div>
                <Badge
                  variant={
                    bankAccount.verificationStatus === "VERIFIED"
                      ? "default"
                      : bankAccount.verificationStatus === "PENDING"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {bankAccount.verificationStatus}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
