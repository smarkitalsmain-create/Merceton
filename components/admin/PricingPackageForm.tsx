"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { createPricingPackage, updatePricingPackage } from "@/app/actions/pricing"
import { useRouter } from "next/navigation"
import { Save } from "lucide-react"

interface PricingPackageFormProps {
  initialData?: {
    id: string
    name: string
    description: string | null
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
  }
}

export function PricingPackageForm({ initialData }: PricingPackageFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    fixedFeePaise: initialData?.fixedFeePaise ? (initialData.fixedFeePaise / 100).toString() : "10",
    variableFeeBps: initialData?.variableFeeBps ? (initialData.variableFeeBps / 100).toString() : "1",
    domainPricePaise: initialData?.domainPricePaise ? (initialData.domainPricePaise / 100).toString() : "99",
    domainAllowed: initialData?.domainAllowed ?? true,
    domainIncluded: initialData?.domainIncluded ?? false,
    payoutFrequency: initialData?.payoutFrequency || "WEEKLY",
    holdbackBps: initialData?.holdbackBps ? (initialData.holdbackBps / 100).toString() : "0",
    isPayoutHold: initialData?.isPayoutHold ?? false,
    isActive: initialData?.isActive ?? true,
    visibility: initialData?.visibility || "PUBLIC",
    reason: "",
  })

  // Show status if editing
  const currentStatus = initialData ? (initialData as any).status : "DRAFT"
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    const fixedFee = parseFloat(formData.fixedFeePaise)
    if (isNaN(fixedFee) || fixedFee < 0 || fixedFee > 10000) {
      newErrors.fixedFeePaise = "Fixed fee must be between ₹0 and ₹10,000"
    }

    const variableFee = parseFloat(formData.variableFeeBps)
    if (isNaN(variableFee) || variableFee < 0 || variableFee > 10) {
      newErrors.variableFeeBps = "Variable fee must be between 0% and 10%"
    }

    const domainPrice = parseFloat(formData.domainPricePaise)
    if (isNaN(domainPrice) || domainPrice < 0 || domainPrice > 5000) {
      newErrors.domainPricePaise = "Domain price must be between ₹0 and ₹5,000"
    }

    const holdback = parseFloat(formData.holdbackBps)
    if (isNaN(holdback) || holdback < 0 || holdback > 50) {
      newErrors.holdbackBps = "Holdback must be between 0% and 50%"
    }

    if (formData.domainIncluded && !formData.domainAllowed) {
      newErrors.domainIncluded = "Domain must be allowed if included"
    }

    if (!formData.reason.trim()) {
      newErrors.reason = "Reason is required for audit logging"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        const data = {
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          fixedFeePaise: Math.round(parseFloat(formData.fixedFeePaise) * 100),
          variableFeeBps: Math.round(parseFloat(formData.variableFeeBps) * 100),
          domainPricePaise: Math.round(parseFloat(formData.domainPricePaise) * 100),
          domainAllowed: formData.domainAllowed,
          domainIncluded: formData.domainIncluded,
          payoutFrequency: formData.payoutFrequency as "WEEKLY" | "DAILY" | "MANUAL",
          holdbackBps: Math.round(parseFloat(formData.holdbackBps) * 100),
          isPayoutHold: formData.isPayoutHold,
          isActive: formData.isActive,
          visibility: formData.visibility as "PUBLIC" | "INTERNAL",
          reason: formData.reason.trim(),
        }

        let result
        if (initialData) {
          result = await updatePricingPackage(initialData.id, data)
        } else {
          result = await createPricingPackage(data)
        }

        if (result.success) {
          toast({
            title: "Success",
            description: `Package ${initialData ? "updated" : "created"} successfully`,
          })
          router.push(`/admin/pricing/${result.package.id}`)
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to save package",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{initialData ? "Edit Package" : "Create Package"}</CardTitle>
          <CardDescription>
            {initialData
              ? `Configure pricing plan details (Status: ${currentStatus})`
              : "Configure pricing plan details (will be created as DRAFT)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Package Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                if (errors.name) setErrors({ ...errors, name: "" })
              }}
              required
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fixedFeePaise">Fixed Fee (₹) *</Label>
              <Input
                id="fixedFeePaise"
                type="number"
                step="0.01"
                min="0"
                max="10000"
                value={formData.fixedFeePaise}
                onChange={(e) => {
                  setFormData({ ...formData, fixedFeePaise: e.target.value })
                  if (errors.fixedFeePaise) setErrors({ ...errors, fixedFeePaise: "" })
                }}
                required
                className={errors.fixedFeePaise ? "border-destructive" : ""}
              />
              <p className="text-xs text-muted-foreground">Per successful order (0-₹10,000)</p>
              {errors.fixedFeePaise && <p className="text-sm text-destructive">{errors.fixedFeePaise}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="variableFeeBps">Variable Fee (%) *</Label>
              <Input
                id="variableFeeBps"
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={formData.variableFeeBps}
                onChange={(e) => {
                  setFormData({ ...formData, variableFeeBps: e.target.value })
                  if (errors.variableFeeBps) setErrors({ ...errors, variableFeeBps: "" })
                }}
                required
                className={errors.variableFeeBps ? "border-destructive" : ""}
              />
              <p className="text-xs text-muted-foreground">Per successful order (0-10%)</p>
              {errors.variableFeeBps && <p className="text-sm text-destructive">{errors.variableFeeBps}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="domainPricePaise">Domain Price (₹/month)</Label>
            <Input
              id="domainPricePaise"
              type="number"
              step="0.01"
              min="0"
              max="5000"
              value={formData.domainPricePaise}
              onChange={(e) => {
                setFormData({ ...formData, domainPricePaise: e.target.value })
                if (errors.domainPricePaise) setErrors({ ...errors, domainPricePaise: "" })
              }}
              disabled={!formData.domainAllowed}
              className={errors.domainPricePaise ? "border-destructive" : ""}
            />
            {errors.domainPricePaise && <p className="text-sm text-destructive">{errors.domainPricePaise}</p>}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="domainAllowed">Domain Allowed</Label>
                <p className="text-xs text-muted-foreground">
                  Allow merchants to purchase domain subscription
                </p>
              </div>
              <Switch
                id="domainAllowed"
                checked={formData.domainAllowed}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, domainAllowed: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="domainIncluded">Domain Included</Label>
                <p className="text-xs text-muted-foreground">
                  Domain is included in plan (auto-enabled)
                </p>
              </div>
              <Switch
                id="domainIncluded"
                checked={formData.domainIncluded}
                onCheckedChange={(checked) => {
                  setFormData({
                    ...formData,
                    domainIncluded: checked,
                    domainAllowed: checked ? true : formData.domainAllowed,
                  })
                  if (errors.domainIncluded) setErrors({ ...errors, domainIncluded: "" })
                }}
              />
            </div>
            {errors.domainIncluded && (
              <p className="text-sm text-destructive">{errors.domainIncluded}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payoutFrequency">Payout Frequency *</Label>
              <Select
                value={formData.payoutFrequency}
                onValueChange={(value) => setFormData({ ...formData, payoutFrequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="holdbackBps">Holdback (%)</Label>
              <Input
                id="holdbackBps"
                type="number"
                step="0.01"
                min="0"
                max="50"
                value={formData.holdbackBps}
                onChange={(e) => {
                  setFormData({ ...formData, holdbackBps: e.target.value })
                  if (errors.holdbackBps) setErrors({ ...errors, holdbackBps: "" })
                }}
                className={errors.holdbackBps ? "border-destructive" : ""}
              />
              <p className="text-xs text-muted-foreground">0-50%</p>
              {errors.holdbackBps && <p className="text-sm text-destructive">{errors.holdbackBps}</p>}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isPayoutHold">Payout Hold</Label>
              <p className="text-xs text-muted-foreground">Hold payouts for this plan</p>
            </div>
            <Switch
              id="isPayoutHold"
              checked={formData.isPayoutHold}
              onCheckedChange={(checked) => setFormData({ ...formData, isPayoutHold: checked })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility *</Label>
              <Select
                value={formData.visibility}
                onValueChange={(value) => setFormData({ ...formData, visibility: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">Public</SelectItem>
                  <SelectItem value="INTERNAL">Internal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">Active</Label>
                <p className="text-xs text-muted-foreground">Package is active</p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for {initialData ? "Update" : "Creation"} *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => {
                setFormData({ ...formData, reason: e.target.value })
                if (errors.reason) setErrors({ ...errors, reason: "" })
              }}
              placeholder="Required for audit logging"
              required
              rows={2}
              className={errors.reason ? "border-destructive" : ""}
            />
            {errors.reason && <p className="text-sm text-destructive">{errors.reason}</p>}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              <Save className="h-4 w-4 mr-2" />
              {isPending ? "Saving..." : "Save Package"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
