"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MerchantPricingAdminForm } from "@/components/admin/MerchantPricingAdminForm"

type EffectivePricing = {
  fixedFeePaise: number
  variableFeeBps: number
  payoutFrequency: "WEEKLY" | "DAILY" | "MANUAL"
  packageId: string | null
  packageName: string | null
}

interface MerchantPricingTabProps {
  merchant: {
    id: string
    displayName: string
  }
  feeConfig: {
    id: string
    pricingPackageId: string | null
    fixedFeeOverridePaise: number | null
    variableFeeOverrideBps: number | null
    payoutFrequencyOverride: "WEEKLY" | "DAILY" | "MANUAL" | null
    holdbackOverrideBps: number | null
    isPayoutHoldOverride: boolean | null
    pricingPackage: {
      id: string
      name: string
      fixedFeePaise: number
      variableFeeBps: number
      payoutFrequency: "WEEKLY" | "DAILY" | "MANUAL"
    } | null
  } | null
  effectiveConfig: EffectivePricing
  packages: Array<{
    id: string
    name: string
    fixedFeePaise: number
    variableFeeBps: number
    payoutFrequency: "WEEKLY" | "DAILY" | "MANUAL"
  }>
}

export function MerchantPricingTab({
  merchant,
  feeConfig,
  effectiveConfig,
  packages,
}: MerchantPricingTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Pricing</CardTitle>
          <CardDescription>Effective fee configuration</CardDescription>
        </CardHeader>
        <CardContent>
          {effectiveConfig.packageName ? (
            <div className="space-y-2">
              <p>
                <strong>Package:</strong> {effectiveConfig.packageName}
              </p>
              <p>
                <strong>Fixed Fee:</strong> ₹{(effectiveConfig.fixedFeePaise / 100).toFixed(2)}
              </p>
              <p>
                <strong>Variable Fee:</strong> {effectiveConfig.variableFeeBps / 100}% per order
              </p>
              <p>
                <strong>Payout Frequency:</strong> {effectiveConfig.payoutFrequency}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">No package assigned</p>
          )}
        </CardContent>
      </Card>

      <MerchantPricingAdminForm merchant={merchant} feeConfig={feeConfig} packages={packages} />
    </div>
  )
}
