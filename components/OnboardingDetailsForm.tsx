"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  panStepSchema,
  gstStepSchema,
  businessBasicsStepSchema,
  type PanStepData,
  type GstStepData,
  type BusinessBasicsStepData,
} from "@/lib/validations/onboarding"
import { maskPan, maskGstin } from "@/lib/onboardingMask"
import {
  updateOnboardingPan,
  updateOnboardingGst,
  updateOnboardingBusiness,
} from "@/app/actions/onboarding"
import { Lock, Edit2, X, Save } from "lucide-react"

interface OnboardingDetailsFormProps {
  initialOnboarding: {
    onboardingStatus: string
    panType?: string | null
    panNumber?: string | null
    panName?: string | null
    panDobOrIncorp?: string | null
    panHolderRole?: string | null
    gstStatus: string
    gstin?: string | null
    gstLegalName?: string | null
    gstTradeName?: string | null
    gstState?: string | null
    gstComposition?: boolean
    gstNotRegisteredReason?: string | null
    storeDisplayName?: string | null
    legalBusinessName?: string | null
    yearStarted?: number | null
    businessType?: string | null
    primaryCategory?: string | null
    secondaryCategory?: string | null
    avgPriceRange?: string | null
    expectedSkuRange?: string | null
  }
  hasOrders: boolean
}

type Section = "NONE" | "PAN" | "GST" | "BUSINESS"

export function OnboardingDetailsForm({
  initialOnboarding,
  hasOrders,
}: OnboardingDetailsFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [editingSection, setEditingSection] = useState<Section>("NONE")
  const [isPending, startTransition] = useTransition()

  const panForm = useForm<PanStepData>({
    resolver: zodResolver(panStepSchema),
    defaultValues: {
      panType: (initialOnboarding.panType as any) || "INDIVIDUAL",
      panNumber: initialOnboarding.panNumber || "",
      panName: initialOnboarding.panName || "",
      panDobOrIncorp: initialOnboarding.panDobOrIncorp
        ? initialOnboarding.panDobOrIncorp.slice(0, 10)
        : "",
      panHolderRole: initialOnboarding.panHolderRole || "",
    },
  })

  const gstForm = useForm<GstStepData>({
    resolver: zodResolver(gstStepSchema),
    defaultValues: {
      gstStatus: (initialOnboarding.gstStatus as any) || "NOT_REGISTERED",
      gstin: initialOnboarding.gstin || "",
      gstLegalName: initialOnboarding.gstLegalName || "",
      gstTradeName: initialOnboarding.gstTradeName || "",
      gstState: initialOnboarding.gstState || "",
      gstComposition: initialOnboarding.gstComposition || false,
      gstNotRegisteredReason: initialOnboarding.gstNotRegisteredReason || "",
    },
  })

  const businessForm = useForm<BusinessBasicsStepData>({
    resolver: zodResolver(businessBasicsStepSchema),
    defaultValues: {
      storeDisplayName: initialOnboarding.storeDisplayName || "",
      legalBusinessName: initialOnboarding.legalBusinessName || "",
      yearStarted: initialOnboarding.yearStarted || undefined,
      businessType: (initialOnboarding.businessType as any) || undefined,
      primaryCategory: initialOnboarding.primaryCategory || "",
      secondaryCategory: initialOnboarding.secondaryCategory || "",
      avgPriceRange: (initialOnboarding.avgPriceRange as any) || undefined,
      expectedSkuRange: (initialOnboarding.expectedSkuRange as any) || undefined,
    },
  })

  const canEditPanNumber =
    initialOnboarding.onboardingStatus !== "COMPLETED" && !hasOrders

  const currentGstStatus = gstForm.watch("gstStatus")
  const isRegistered = currentGstStatus === "REGISTERED"
  const originalGstStatus = initialOnboarding.gstStatus
  const ordersExist = hasOrders
  // GSTIN is hard-locked only if original status was REGISTERED and there are existing orders
  const isGstinHardLocked = originalGstStatus === "REGISTERED" && ordersExist
  // In edit mode, GSTIN is enabled only when status is REGISTERED and not hard-locked
  const canEditGstin = isRegistered && !isGstinHardLocked

  const handlePanSave = (data: PanStepData) => {
    startTransition(async () => {
      const result = await updateOnboardingPan(data)
      if (result.success) {
        toast({
          title: "PAN details updated",
          description: "Your PAN information has been updated successfully.",
        })
        setEditingSection("NONE")
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update PAN details",
          variant: "destructive",
        })
      }
    })
  }

  const handleGstSave = (data: GstStepData) => {
    startTransition(async () => {
      // Confirm when downgrading from REGISTERED
      if (
        initialOnboarding.gstStatus === "REGISTERED" &&
        data.gstStatus !== "REGISTERED"
      ) {
        const ok = window.confirm(
          "You are changing GST status from REGISTERED to a non-registered state. This may impact invoicing and tax calculations. Are you sure?"
        )
        if (!ok) {
          return
        }
      }

      const result = await updateOnboardingGst(data)
      if (result.success) {
        toast({
          title: "GST details updated",
          description:
            "Your GST registration information has been updated. Product GST requirements will reflect this change.",
        })
        setEditingSection("NONE")
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update GST details",
          variant: "destructive",
        })
      }
    })
  }

  const handleBusinessSave = (data: BusinessBasicsStepData) => {
    startTransition(async () => {
      const result = await updateOnboardingBusiness(data)
      if (result.success) {
        toast({
          title: "Business details updated",
          description: "Your business basics have been updated successfully.",
        })
        setEditingSection("NONE")
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update business details",
          variant: "destructive",
        })
      }
    })
  }

  const statusColor =
    initialOnboarding.onboardingStatus === "COMPLETED" ? "default" : "secondary"

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Onboarding Status</CardTitle>
          <CardDescription>Overall status of your onboarding information</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Keep your compliance details up to date to ensure smooth operations.
            </p>
          </div>
          <Badge variant={statusColor}>
            {initialOnboarding.onboardingStatus || "NOT_STARTED"}
          </Badge>
        </CardContent>
      </Card>

      {/* PAN Details */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>PAN Details</CardTitle>
            <CardDescription>Permanent Account Number information</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {editingSection !== "PAN" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingSection("PAN")}
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingSection("NONE")}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingSection !== "PAN" ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">PAN Type</span>
                <span>{initialOnboarding.panType || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">PAN Number</span>
                <span>{maskPan(initialOnboarding.panNumber)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name as per PAN</span>
                <span>{initialOnboarding.panName || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date of Birth / Incorporation</span>
                <span>
                  {initialOnboarding.panDobOrIncorp
                    ? initialOnboarding.panDobOrIncorp.slice(0, 10)
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span>{initialOnboarding.panHolderRole || "-"}</span>
              </div>
              {!canEditPanNumber && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  PAN number is locked after onboarding completion or once orders exist to
                  keep records consistent.
                </p>
              )}
            </div>
          ) : (
            <form
              onSubmit={panForm.handleSubmit(handlePanSave)}
              className="space-y-4 text-sm"
            >
              <div className="space-y-2">
                <Label htmlFor="panType">PAN Type</Label>
                <Input id="panType" {...panForm.register("panType")} />
                {panForm.formState.errors.panType && (
                  <p className="text-xs text-destructive">
                    {panForm.formState.errors.panType.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="panNumber">PAN Number</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="panNumber"
                    {...panForm.register("panNumber")}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    className="uppercase"
                    disabled={!canEditPanNumber}
                  />
                  {!canEditPanNumber && (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                {panForm.formState.errors.panNumber && (
                  <p className="text-xs text-destructive">
                    {panForm.formState.errors.panNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="panName">Name as per PAN</Label>
                <Input
                  id="panName"
                  {...panForm.register("panName")}
                  placeholder="Enter name as per PAN card"
                />
                {panForm.formState.errors.panName && (
                  <p className="text-xs text-destructive">
                    {panForm.formState.errors.panName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="panDobOrIncorp">Date of Birth / Incorporation</Label>
                <Input
                  id="panDobOrIncorp"
                  type="date"
                  {...panForm.register("panDobOrIncorp")}
                />
                {panForm.formState.errors.panDobOrIncorp && (
                  <p className="text-xs text-destructive">
                    {panForm.formState.errors.panDobOrIncorp.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="panHolderRole">Role</Label>
                <Input
                  id="panHolderRole"
                  {...panForm.register("panHolderRole")}
                  placeholder="e.g., Proprietor, Director, Partner"
                />
                {panForm.formState.errors.panHolderRole && (
                  <p className="text-xs text-destructive">
                    {panForm.formState.errors.panHolderRole.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingSection("NONE")}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Save className="h-4 w-4 mr-1 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* GST Details */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>GST Details</CardTitle>
            <CardDescription>Goods and Services Tax registration</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {editingSection !== "GST" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingSection("GST")}
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingSection("NONE")}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingSection !== "GST" ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST Status</span>
                <span>{initialOnboarding.gstStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GSTIN</span>
                <span>{maskGstin(initialOnboarding.gstin)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Legal Name</span>
                <span>{initialOnboarding.gstLegalName || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trade Name</span>
                <span>{initialOnboarding.gstTradeName || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">State</span>
                <span>{initialOnboarding.gstState || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Composition Scheme</span>
                <span>{initialOnboarding.gstComposition ? "Yes" : "No"}</span>
              </div>
              {initialOnboarding.gstStatus === "NOT_REGISTERED" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reason</span>
                  <span>{initialOnboarding.gstNotRegisteredReason || "-"}</span>
                </div>
              )}
              {isGstinHardLocked && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  GSTIN is locked after orders exist to avoid inconsistencies in tax
                  records.
                </p>
              )}
            </div>
          ) : (
            <form
              onSubmit={gstForm.handleSubmit(handleGstSave)}
              className="space-y-4 text-sm"
            >
              <div className="space-y-2">
                <Label htmlFor="gstStatus">GST Status</Label>
                <Select
                  value={gstForm.watch("gstStatus")}
                  onValueChange={(value) => gstForm.setValue("gstStatus", value as any)}
                >
                  <SelectTrigger id="gstStatus">
                    <SelectValue placeholder="Select GST status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOT_REGISTERED">Not Registered</SelectItem>
                    <SelectItem value="APPLIED">Applied / Pending</SelectItem>
                    <SelectItem value="REGISTERED">Registered</SelectItem>
                  </SelectContent>
                </Select>
                {gstForm.formState.errors.gstStatus && (
                  <p className="text-xs text-destructive">
                    {gstForm.formState.errors.gstStatus.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN</Label>
                <div className="flex items-center gap-2">
                    <Input
                      id="gstin"
                      {...gstForm.register("gstin")}
                      placeholder="15-character GSTIN"
                      maxLength={15}
                      disabled={!canEditGstin}
                    />
                  {!canEditGstin && (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                {gstForm.formState.errors.gstin && (
                  <p className="text-xs text-destructive">
                    {gstForm.formState.errors.gstin.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstLegalName">Legal Name as per GST</Label>
                <Input
                  id="gstLegalName"
                  {...gstForm.register("gstLegalName")}
                  placeholder="Legal business name"
                  disabled={currentGstStatus !== "REGISTERED"}
                />
                {gstForm.formState.errors.gstLegalName && (
                  <p className="text-xs text-destructive">
                    {gstForm.formState.errors.gstLegalName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstTradeName">Trade Name (Optional)</Label>
                <Input
                  id="gstTradeName"
                  {...gstForm.register("gstTradeName")}
                  placeholder="Trade name if different"
                  disabled={currentGstStatus !== "REGISTERED"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstState">State</Label>
                <Input
                  id="gstState"
                  {...gstForm.register("gstState")}
                  placeholder="State code or name"
                  disabled={currentGstStatus !== "REGISTERED"}
                />
                {gstForm.formState.errors.gstState && (
                  <p className="text-xs text-destructive">
                    {gstForm.formState.errors.gstState.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstNotRegisteredReason">
                  Reason (if not registered, optional)
                </Label>
                <Textarea
                  id="gstNotRegisteredReason"
                  {...gstForm.register("gstNotRegisteredReason")}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingSection("NONE")}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Save className="h-4 w-4 mr-1 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Business Basics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Business Basics</CardTitle>
            <CardDescription>Store identity and product categories</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {editingSection !== "BUSINESS" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingSection("BUSINESS")}
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingSection("NONE")}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingSection !== "BUSINESS" ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Store Display Name</span>
                <span>{initialOnboarding.storeDisplayName || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Legal Business Name</span>
                <span>{initialOnboarding.legalBusinessName || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Year Started</span>
                <span>{initialOnboarding.yearStarted || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Business Type</span>
                <span>{initialOnboarding.businessType || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Primary Category</span>
                <span>{initialOnboarding.primaryCategory || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Secondary Category</span>
                <span>{initialOnboarding.secondaryCategory || "-"}</span>
              </div>
            </div>
          ) : (
            <form
              onSubmit={businessForm.handleSubmit(handleBusinessSave)}
              className="space-y-4 text-sm"
            >
              <div className="space-y-2">
                <Label htmlFor="storeDisplayName">Store Display Name</Label>
                <Input
                  id="storeDisplayName"
                  {...businessForm.register("storeDisplayName")}
                  placeholder="Name customers will see"
                />
                {businessForm.formState.errors.storeDisplayName && (
                  <p className="text-xs text-destructive">
                    {businessForm.formState.errors.storeDisplayName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="legalBusinessName">Legal Business Name</Label>
                <Input
                  id="legalBusinessName"
                  {...businessForm.register("legalBusinessName")}
                  placeholder="Legal name if different"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearStarted">Year Started</Label>
                <Input
                  id="yearStarted"
                  type="number"
                  {...businessForm.register("yearStarted", { valueAsNumber: true })}
                  placeholder="e.g., 2020"
                  min={1900}
                  max={new Date().getFullYear()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type</Label>
                <Input
                  id="businessType"
                  {...businessForm.register("businessType")}
                  placeholder="e.g., SOLE_PROPRIETORSHIP, LLP"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryCategory">Primary Category</Label>
                <Input
                  id="primaryCategory"
                  {...businessForm.register("primaryCategory")}
                  placeholder="e.g., Fashion, Electronics"
                />
                {businessForm.formState.errors.primaryCategory && (
                  <p className="text-xs text-destructive">
                    {businessForm.formState.errors.primaryCategory.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryCategory">Secondary Category (Optional)</Label>
                <Input
                  id="secondaryCategory"
                  {...businessForm.register("secondaryCategory")}
                  placeholder="Additional category"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avgPriceRange">Average Price Range (Optional)</Label>
                <Input
                  id="avgPriceRange"
                  {...businessForm.register("avgPriceRange")}
                  placeholder="e.g., UNDER_500, 500_1000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedSkuRange">Expected SKU Range (Optional)</Label>
                <Input
                  id="expectedSkuRange"
                  {...businessForm.register("expectedSkuRange")}
                  placeholder="e.g., UNDER_10, 10_50"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingSection("NONE")}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Save className="h-4 w-4 mr-1 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

