"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { assignMerchantPricingPackage, updateMerchantFeeOverrides } from "@/app/actions/pricing"
import { useRouter } from "next/navigation"
import { Save } from "lucide-react"

interface MerchantPricingAdminFormProps {
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
  } | null
  packages: Array<{
    id: string
    name: string
    fixedFeePaise: number
    variableFeeBps: number
    payoutFrequency: "WEEKLY" | "DAILY" | "MANUAL"
  }>
}

export function MerchantPricingAdminForm({
  merchant,
  feeConfig,
  packages,
}: MerchantPricingAdminFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    pricingPackageId: feeConfig?.pricingPackageId || "",
    fixedFeeOverridePaise: feeConfig?.fixedFeeOverridePaise
      ? (feeConfig.fixedFeeOverridePaise / 100).toString()
      : "",
    variableFeeOverrideBps: feeConfig?.variableFeeOverrideBps
      ? (feeConfig.variableFeeOverrideBps / 100).toString()
      : "",
    payoutFrequencyOverride: feeConfig?.payoutFrequencyOverride || "",
    holdbackOverrideBps: feeConfig?.holdbackOverrideBps
      ? (feeConfig.holdbackOverrideBps / 100).toString()
      : "",
    isPayoutHoldOverride: feeConfig?.isPayoutHoldOverride ?? false,
    reason: "",
  })

  const selectedPackage = packages.find((p) => p.id === formData.pricingPackageId)

  const handleAssignPackage = () => {
    if (!formData.pricingPackageId || !formData.reason.trim()) {
      toast({
        title: "Error",
        description: "Package and reason are required",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        const result = await assignMerchantPricingPackage(merchant.id, {
          pricingPackageId: formData.pricingPackageId,
          reason: formData.reason,
        })
        if (result.success) {
          toast({
            title: "Success",
            description: "Package assigned successfully",
          })
          router.refresh()
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to assign package",
          variant: "destructive",
        })
      }
    })
  }

  const handleUpdateOverrides = () => {
    if (!formData.reason.trim()) {
      toast({
        title: "Error",
        description: "Reason is required",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        const result = await updateMerchantFeeOverrides(merchant.id, {
          fixedFeeOverridePaise: formData.fixedFeeOverridePaise
            ? Math.round(parseFloat(formData.fixedFeeOverridePaise) * 100)
            : null,
          variableFeeOverrideBps: formData.variableFeeOverrideBps
            ? Math.round(parseFloat(formData.variableFeeOverrideBps) * 100)
            : null,
          payoutFrequencyOverride: (formData.payoutFrequencyOverride ||
            null) as "WEEKLY" | "DAILY" | "MANUAL" | null,
          holdbackOverrideBps: formData.holdbackOverrideBps
            ? Math.round(parseFloat(formData.holdbackOverrideBps) * 100)
            : null,
          isPayoutHoldOverride: formData.isPayoutHoldOverride,
          reason: formData.reason,
        })
        if (result.success) {
          toast({
            title: "Success",
            description: "Overrides updated successfully",
          })
          router.refresh()
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to update overrides",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assign Pricing Package</CardTitle>
          <CardDescription>Select a pricing plan for this merchant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pricingPackageId">Package *</Label>
            <Select
              value={formData.pricingPackageId}
              onValueChange={(value) => setFormData({ ...formData, pricingPackageId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a package" />
              </SelectTrigger>
              <SelectContent>
                {packages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.name} - ₹{(pkg.fixedFeePaise / 100).toFixed(2)} + {pkg.variableFeeBps / 100}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPackage && (
            <div className="rounded-md border p-4 bg-muted/50">
              <h4 className="font-medium mb-2">Package Details</h4>
              <div className="text-sm space-y-1">
                <div>Fixed Fee: ₹{(selectedPackage.fixedFeePaise / 100).toFixed(2)}</div>
                <div>Variable Fee: {selectedPackage.variableFeeBps / 100}%</div>
                <div>Payout Frequency: {selectedPackage.payoutFrequency}</div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Required for audit logging"
              required
              rows={2}
            />
          </div>

          <Button onClick={handleAssignPackage} disabled={isPending}>
            <Save className="h-4 w-4 mr-2" />
            Assign Package
          </Button>
        </CardContent>
      </Card>

      {feeConfig?.pricingPackageId && (
        <Card>
          <CardHeader>
            <CardTitle>Fee Overrides (Admin Only)</CardTitle>
            <CardDescription>
              Override package values for this merchant. Leave empty to use package defaults.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fixedFeeOverridePaise">Fixed Fee Override (₹)</Label>
                <Input
                  id="fixedFeeOverridePaise"
                  type="number"
                  step="0.01"
                  value={formData.fixedFeeOverridePaise}
                  onChange={(e) =>
                    setFormData({ ...formData, fixedFeeOverridePaise: e.target.value })
                  }
                  placeholder="Leave empty for package default"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="variableFeeOverrideBps">Variable Fee Override (%)</Label>
                <Input
                  id="variableFeeOverrideBps"
                  type="number"
                  step="0.01"
                  value={formData.variableFeeOverrideBps}
                  onChange={(e) =>
                    setFormData({ ...formData, variableFeeOverrideBps: e.target.value })
                  }
                  placeholder="Leave empty for package default"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payoutFrequencyOverride">Payout Frequency Override</Label>
              <Select
                value={formData.payoutFrequencyOverride}
                onValueChange={(value) =>
                  setFormData({ ...formData, payoutFrequencyOverride: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Use package default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Use package default</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="holdbackOverrideBps">Holdback Override (%)</Label>
              <Input
                id="holdbackOverrideBps"
                type="number"
                step="0.01"
                value={formData.holdbackOverrideBps}
                onChange={(e) =>
                  setFormData({ ...formData, holdbackOverrideBps: e.target.value })
                }
                placeholder="Leave empty for package default"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reasonOverride">Reason for Overrides *</Label>
              <Textarea
                id="reasonOverride"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Required for audit logging"
                required
                rows={2}
              />
            </div>

            <Button onClick={handleUpdateOverrides} disabled={isPending} variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Update Overrides
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
