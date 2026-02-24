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
  contactInfoSchema,
  type PanStepData,
  type GstStepData,
  type BusinessBasicsStepData,
  type ContactInfoData,
} from "@/lib/validations/onboarding"
import { maskPan, maskGstin } from "@/lib/onboardingMask"
import {
  updateOnboardingPan,
  updateOnboardingGst,
  updateOnboardingBusiness,
  updateOnboardingContactInfo,
} from "@/app/actions/onboarding"
import { Lock, Edit2, X, Save } from "lucide-react"
import { toDateInputValue } from "@/lib/dateUtils"

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
    contactEmail?: string | null
    contactPhone?: string | null
    websiteUrl?: string | null
    contactAddressLine1?: string | null
    contactAddressLine2?: string | null
    contactCity?: string | null
    contactState?: string | null
    contactPincode?: string | null
  }
  hasOrders: boolean
}

type Section = "NONE" | "PAN" | "GST" | "BUSINESS" | "CONTACT"

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
      // Convert Date to string for date input (Zod z.coerce.date() will convert back to Date on submit)
      panDobOrIncorp: (toDateInputValue(initialOnboarding.panDobOrIncorp) || undefined) as any,
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

  const contactForm = useForm<ContactInfoData>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: {
      contactEmail: initialOnboarding.contactEmail || "",
      contactPhone: initialOnboarding.contactPhone || "",
      websiteUrl: initialOnboarding.websiteUrl || "",
    },
  })

  // Note: panVerifiedAt field doesn't exist in schema - always false
  const isPanVerified = false
  const canEditPanNumber =
    !isPanVerified &&
    initialOnboarding.onboardingStatus !== "COMPLETED" &&
    !hasOrders

  const currentGstStatus = gstForm.watch("gstStatus")
  const isRegistered = currentGstStatus === "REGISTERED"
  const originalGstStatus = initialOnboarding.gstStatus
  const ordersExist = hasOrders
  // Note: gstVerifiedAt field doesn't exist in schema - always false
  const isGstVerified = false
  // GSTIN is hard-locked only if original status was REGISTERED and there are existing orders
  // or if GST has been explicitly verified
  const isGstinHardLocked =
    isGstVerified || (originalGstStatus === "REGISTERED" && ordersExist)
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

  const handleContactSave = (data: ContactInfoData) => {
    startTransition(async () => {
      const result = await updateOnboardingContactInfo(data)
      if (result.success) {
        toast({
          title: "Contact info updated",
          description: "Your contact information has been updated successfully.",
        })
        setEditingSection("NONE")
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update contact info",
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
                disabled={isPanVerified}
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
            {isPanVerified && (
              <span className="flex items-center text-xs text-muted-foreground" title="Locked after verification">
                <Lock className="h-3 w-3 mr-1" />
                Locked after verification
              </span>
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
                <span className="inline-flex items-center gap-1">
                  {maskPan(initialOnboarding.panNumber)}
                  {isPanVerified && (
                    <Lock
                      className="h-3 w-3 text-muted-foreground"
                      aria-label="Locked after verification"
                    />
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name as per PAN</span>
                <span>{initialOnboarding.panName || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date of Birth / Incorporation</span>
                <span>
                  {initialOnboarding.panDobOrIncorp
                    ? toDateInputValue(initialOnboarding.panDobOrIncorp)
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

      {/* Contact Info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Contact Info</CardTitle>
            <CardDescription>Support contact details for invoices</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {editingSection !== "CONTACT" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingSection("CONTACT")}
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
          {editingSection !== "CONTACT" ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Support Email</span>
                <span>{initialOnboarding.contactEmail || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Support Phone</span>
                <span>{initialOnboarding.contactPhone || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Website</span>
                <span>{initialOnboarding.websiteUrl || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Address Line 1</span>
                <span>{initialOnboarding.contactAddressLine1 || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Address Line 2</span>
                <span>{initialOnboarding.contactAddressLine2 || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">City</span>
                <span>{initialOnboarding.contactCity || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">State</span>
                <span>{initialOnboarding.contactState || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pincode</span>
                <span>{initialOnboarding.contactPincode || "-"}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={contactForm.handleSubmit(handleContactSave)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Support Email (Optional)</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  {...contactForm.register("contactEmail")}
                  placeholder="support@example.com"
                />
                {contactForm.formState.errors.contactEmail && (
                  <p className="text-xs text-destructive">
                    {contactForm.formState.errors.contactEmail.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Support Phone (Optional)</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  {...contactForm.register("contactPhone")}
                  placeholder="+91 1234567890"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Website URL (Optional)</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  {...contactForm.register("websiteUrl")}
                  placeholder="https://example.com"
                />
                {contactForm.formState.errors.websiteUrl && (
                  <p className="text-xs text-destructive">
                    {contactForm.formState.errors.websiteUrl.message}
                  </p>
                )}
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-semibold mb-4">Address</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactAddressLine1">Address Line 1 *</Label>
                    <Input
                      id="contactAddressLine1"
                      {...contactForm.register("contactAddressLine1")}
                      placeholder="Street address, building name"
                    />
                    {contactForm.formState.errors.contactAddressLine1 && (
                      <p className="text-xs text-destructive">
                        {contactForm.formState.errors.contactAddressLine1.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactAddressLine2">Address Line 2 (Optional)</Label>
                    <Input
                      id="contactAddressLine2"
                      {...contactForm.register("contactAddressLine2")}
                      placeholder="Apartment, suite, unit, etc."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactCity">City *</Label>
                      <Input
                        id="contactCity"
                        {...contactForm.register("contactCity")}
                        placeholder="City"
                      />
                      {contactForm.formState.errors.contactCity && (
                        <p className="text-xs text-destructive">
                          {contactForm.formState.errors.contactCity.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactState">State *</Label>
                      <Select
                        value={contactForm.watch("contactState")}
                        onValueChange={(value) => contactForm.setValue("contactState", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                          <SelectItem value="Arunachal Pradesh">Arunachal Pradesh</SelectItem>
                          <SelectItem value="Assam">Assam</SelectItem>
                          <SelectItem value="Bihar">Bihar</SelectItem>
                          <SelectItem value="Chhattisgarh">Chhattisgarh</SelectItem>
                          <SelectItem value="Goa">Goa</SelectItem>
                          <SelectItem value="Gujarat">Gujarat</SelectItem>
                          <SelectItem value="Haryana">Haryana</SelectItem>
                          <SelectItem value="Himachal Pradesh">Himachal Pradesh</SelectItem>
                          <SelectItem value="Jharkhand">Jharkhand</SelectItem>
                          <SelectItem value="Karnataka">Karnataka</SelectItem>
                          <SelectItem value="Kerala">Kerala</SelectItem>
                          <SelectItem value="Madhya Pradesh">Madhya Pradesh</SelectItem>
                          <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                          <SelectItem value="Manipur">Manipur</SelectItem>
                          <SelectItem value="Meghalaya">Meghalaya</SelectItem>
                          <SelectItem value="Mizoram">Mizoram</SelectItem>
                          <SelectItem value="Nagaland">Nagaland</SelectItem>
                          <SelectItem value="Odisha">Odisha</SelectItem>
                          <SelectItem value="Punjab">Punjab</SelectItem>
                          <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                          <SelectItem value="Sikkim">Sikkim</SelectItem>
                          <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                          <SelectItem value="Telangana">Telangana</SelectItem>
                          <SelectItem value="Tripura">Tripura</SelectItem>
                          <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                          <SelectItem value="Uttarakhand">Uttarakhand</SelectItem>
                          <SelectItem value="West Bengal">West Bengal</SelectItem>
                          <SelectItem value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</SelectItem>
                          <SelectItem value="Chandigarh">Chandigarh</SelectItem>
                          <SelectItem value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</SelectItem>
                          <SelectItem value="Delhi">Delhi</SelectItem>
                          <SelectItem value="Jammu and Kashmir">Jammu and Kashmir</SelectItem>
                          <SelectItem value="Ladakh">Ladakh</SelectItem>
                          <SelectItem value="Lakshadweep">Lakshadweep</SelectItem>
                          <SelectItem value="Puducherry">Puducherry</SelectItem>
                        </SelectContent>
                      </Select>
                      {contactForm.formState.errors.contactState && (
                        <p className="text-xs text-destructive">
                          {contactForm.formState.errors.contactState.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPincode">Pincode *</Label>
                    <Input
                      id="contactPincode"
                      {...contactForm.register("contactPincode")}
                      placeholder="6 digits"
                      maxLength={6}
                      pattern="[0-9]{6}"
                    />
                    {contactForm.formState.errors.contactPincode && (
                      <p className="text-xs text-destructive">
                        {contactForm.formState.errors.contactPincode.message}
                      </p>
                    )}
                  </div>
                </div>
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

