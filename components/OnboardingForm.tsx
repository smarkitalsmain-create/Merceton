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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { savePanStep, saveGstStep, saveBusinessBasicsStep } from "@/app/actions/onboarding"
import {
  panStepSchema,
  gstStepSchema,
  businessBasicsStepSchema,
  type PanStepData,
  type GstStepData,
  type BusinessBasicsStepData,
} from "@/lib/validations/onboarding"
import { Loader2, CheckCircle2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface OnboardingFormProps {
  initialData: {
    onboardingStatus: string
    panType?: string | null
    panNumber?: string | null
    panName?: string | null
    panDobOrIncorp?: Date | null
    panHolderRole?: string | null
    gstStatus?: string
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
}

type Step = 1 | 2 | 3

export function OnboardingForm({ initialData }: OnboardingFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<Step>(() => {
    // Determine current step based on what's completed
    if (!initialData.panNumber) return 1
    if (!initialData.gstStatus || initialData.gstStatus === "NOT_REGISTERED" && !initialData.gstNotRegisteredReason) return 2
    if (!initialData.storeDisplayName || !initialData.primaryCategory) return 3
    return 1
  })
  const [isPending, startTransition] = useTransition()

  // Step 1: PAN Form
  const panForm = useForm<PanStepData>({
    resolver: zodResolver(panStepSchema),
    defaultValues: {
      panType: (initialData.panType as any) || undefined,
      panNumber: initialData.panNumber || "",
      panName: initialData.panName || "",
      panDobOrIncorp: initialData.panDobOrIncorp
        ? new Date(initialData.panDobOrIncorp).toISOString().split("T")[0]
        : "",
      panHolderRole: initialData.panHolderRole || "",
    },
  })

  // Step 2: GST Form
  const gstForm = useForm<GstStepData>({
    resolver: zodResolver(gstStepSchema),
    defaultValues: {
      gstStatus: (initialData.gstStatus as any) || "NOT_REGISTERED",
      gstin: initialData.gstin || "",
      gstLegalName: initialData.gstLegalName || "",
      gstTradeName: initialData.gstTradeName || "",
      gstState: initialData.gstState || "",
      gstComposition: initialData.gstComposition || false,
      gstNotRegisteredReason: initialData.gstNotRegisteredReason || "",
    },
  })

  // Step 3: Business Basics Form
  const businessForm = useForm<BusinessBasicsStepData>({
    resolver: zodResolver(businessBasicsStepSchema),
    defaultValues: {
      storeDisplayName: initialData.storeDisplayName || "",
      legalBusinessName: initialData.legalBusinessName || "",
      yearStarted: initialData.yearStarted || undefined,
      businessType: (initialData.businessType as any) || undefined,
      primaryCategory: initialData.primaryCategory || "",
      secondaryCategory: initialData.secondaryCategory || "",
      avgPriceRange: (initialData.avgPriceRange as any) || undefined,
      expectedSkuRange: (initialData.expectedSkuRange as any) || undefined,
    },
  })

  const handlePanSubmit = (data: PanStepData) => {
    startTransition(async () => {
      const result = await savePanStep(data)
      if (result.success) {
        toast({
          title: "PAN details saved",
          description: "Step 1 completed successfully.",
        })
        setCurrentStep(2)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save PAN details",
          variant: "destructive",
        })
      }
    })
  }

  const handleGstSubmit = (data: GstStepData) => {
    startTransition(async () => {
      const result = await saveGstStep(data)
      if (result.success) {
        toast({
          title: "GST details saved",
          description: "Step 2 completed successfully.",
        })
        setCurrentStep(3)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save GST details",
          variant: "destructive",
        })
      }
    })
  }

  const handleBusinessSubmit = (data: BusinessBasicsStepData) => {
    startTransition(async () => {
      const result = await saveBusinessBasicsStep(data)
      if (result.success) {
        toast({
          title: "Onboarding completed!",
          description: "Your profile is now complete. Redirecting to dashboard...",
        })
        setTimeout(() => {
          router.push("/dashboard")
          router.refresh()
        }, 1000)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save business details",
          variant: "destructive",
        })
      }
    })
  }

  const progress = ((currentStep - 1) / 3) * 100

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Step {currentStep} of 3</span>
              <span className="font-medium">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Step 1: PAN */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: PAN Details</CardTitle>
            <CardDescription>Provide your Permanent Account Number (PAN) information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={panForm.handleSubmit(handlePanSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="panType">PAN Type *</Label>
                <Select
                  value={panForm.watch("panType")}
                  onValueChange={(value) => panForm.setValue("panType", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select PAN type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                    <SelectItem value="COMPANY">Company</SelectItem>
                    <SelectItem value="HUF">HUF</SelectItem>
                    <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                    <SelectItem value="LLP">LLP</SelectItem>
                    <SelectItem value="AOP">AOP</SelectItem>
                    <SelectItem value="BOI">BOI</SelectItem>
                  </SelectContent>
                </Select>
                {panForm.formState.errors.panType && (
                  <p className="text-sm text-destructive">{panForm.formState.errors.panType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="panNumber">PAN Number *</Label>
                <Input
                  id="panNumber"
                  {...panForm.register("panNumber")}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className="uppercase"
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase()
                    panForm.setValue("panNumber", e.target.value)
                  }}
                />
                {panForm.formState.errors.panNumber && (
                  <p className="text-sm text-destructive">{panForm.formState.errors.panNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="panName">Name as per PAN *</Label>
                <Input
                  id="panName"
                  {...panForm.register("panName")}
                  placeholder="Enter name as per PAN card"
                />
                {panForm.formState.errors.panName && (
                  <p className="text-sm text-destructive">{panForm.formState.errors.panName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="panDobOrIncorp">
                  {panForm.watch("panType") === "INDIVIDUAL" ? "Date of Birth" : "Date of Incorporation"} *
                </Label>
                <Input
                  id="panDobOrIncorp"
                  type="date"
                  {...panForm.register("panDobOrIncorp")}
                />
                {panForm.formState.errors.panDobOrIncorp && (
                  <p className="text-sm text-destructive">{panForm.formState.errors.panDobOrIncorp.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="panHolderRole">Role *</Label>
                <Input
                  id="panHolderRole"
                  {...panForm.register("panHolderRole")}
                  placeholder="e.g., Proprietor, Director, Partner"
                />
                {panForm.formState.errors.panHolderRole && (
                  <p className="text-sm text-destructive">{panForm.formState.errors.panHolderRole.message}</p>
                )}
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save & Continue"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: GST */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: GST Details</CardTitle>
            <CardDescription>Provide your GST registration information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={gstForm.handleSubmit(handleGstSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gstStatus">GST Status *</Label>
                <Select
                  value={gstForm.watch("gstStatus")}
                  onValueChange={(value) => {
                    gstForm.setValue("gstStatus", value as any)
                    // Clear GST fields if not registered
                    if (value !== "REGISTERED") {
                      gstForm.setValue("gstin", "")
                      gstForm.setValue("gstLegalName", "")
                      gstForm.setValue("gstTradeName", "")
                      gstForm.setValue("gstState", "")
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select GST status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REGISTERED">Registered</SelectItem>
                    <SelectItem value="APPLIED">Applied (Pending)</SelectItem>
                    <SelectItem value="NOT_REGISTERED">Not Registered</SelectItem>
                  </SelectContent>
                </Select>
                {gstForm.formState.errors.gstStatus && (
                  <p className="text-sm text-destructive">{gstForm.formState.errors.gstStatus.message}</p>
                )}
              </div>

              {gstForm.watch("gstStatus") === "REGISTERED" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="gstin">GSTIN *</Label>
                    <Input
                      id="gstin"
                      {...gstForm.register("gstin")}
                      placeholder="15 alphanumeric characters"
                      maxLength={15}
                      className="uppercase"
                      onChange={(e) => {
                        e.target.value = e.target.value.toUpperCase()
                        gstForm.setValue("gstin", e.target.value)
                      }}
                    />
                    {gstForm.formState.errors.gstin && (
                      <p className="text-sm text-destructive">{gstForm.formState.errors.gstin.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gstLegalName">Legal Name as per GST *</Label>
                    <Input
                      id="gstLegalName"
                      {...gstForm.register("gstLegalName")}
                      placeholder="Legal business name"
                    />
                    {gstForm.formState.errors.gstLegalName && (
                      <p className="text-sm text-destructive">{gstForm.formState.errors.gstLegalName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gstTradeName">Trade Name (Optional)</Label>
                    <Input
                      id="gstTradeName"
                      {...gstForm.register("gstTradeName")}
                      placeholder="Trade name if different"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gstState">State *</Label>
                    <Input
                      id="gstState"
                      {...gstForm.register("gstState")}
                      placeholder="State code or name"
                    />
                    {gstForm.formState.errors.gstState && (
                      <p className="text-sm text-destructive">{gstForm.formState.errors.gstState.message}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="gstComposition"
                      {...gstForm.register("gstComposition")}
                      className="rounded"
                    />
                    <Label htmlFor="gstComposition" className="font-normal">
                      Under Composition Scheme
                    </Label>
                  </div>
                </>
              )}

              {gstForm.watch("gstStatus") === "NOT_REGISTERED" && (
                <div className="space-y-2">
                  <Label htmlFor="gstNotRegisteredReason">Reason (Optional)</Label>
                  <Textarea
                    id="gstNotRegisteredReason"
                    {...gstForm.register("gstNotRegisteredReason")}
                    placeholder="Why is GST not registered?"
                    rows={3}
                  />
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  disabled={isPending}
                >
                  Back
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save & Continue"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Business Basics */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Business Basics</CardTitle>
            <CardDescription>Tell us about your business</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={businessForm.handleSubmit(handleBusinessSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeDisplayName">Store Display Name *</Label>
                <Input
                  id="storeDisplayName"
                  {...businessForm.register("storeDisplayName")}
                  placeholder="Name customers will see"
                />
                {businessForm.formState.errors.storeDisplayName && (
                  <p className="text-sm text-destructive">{businessForm.formState.errors.storeDisplayName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="legalBusinessName">Legal Business Name (Optional)</Label>
                <Input
                  id="legalBusinessName"
                  {...businessForm.register("legalBusinessName")}
                  placeholder="Legal name if different"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="yearStarted">Year Started (Optional)</Label>
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
                  <Label htmlFor="businessType">Business Type (Optional)</Label>
                  <Select
                    value={businessForm.watch("businessType")}
                    onValueChange={(value) => businessForm.setValue("businessType", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SOLE_PROPRIETORSHIP">Sole Proprietorship</SelectItem>
                      <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                      <SelectItem value="LLP">LLP</SelectItem>
                      <SelectItem value="PVT_LTD">Private Limited</SelectItem>
                      <SelectItem value="PUBLIC_LTD">Public Limited</SelectItem>
                      <SelectItem value="HUF">HUF</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryCategory">Primary Category *</Label>
                <Input
                  id="primaryCategory"
                  {...businessForm.register("primaryCategory")}
                  placeholder="e.g., Fashion, Electronics, Food"
                />
                {businessForm.formState.errors.primaryCategory && (
                  <p className="text-sm text-destructive">{businessForm.formState.errors.primaryCategory.message}</p>
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

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="avgPriceRange">Average Price Range (Optional)</Label>
                  <Select
                    value={businessForm.watch("avgPriceRange")}
                    onValueChange={(value) => businessForm.setValue("avgPriceRange", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select price range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNDER_500">Under ₹500</SelectItem>
                      <SelectItem value="500_1000">₹500 - ₹1,000</SelectItem>
                      <SelectItem value="1000_5000">₹1,000 - ₹5,000</SelectItem>
                      <SelectItem value="5000_10000">₹5,000 - ₹10,000</SelectItem>
                      <SelectItem value="ABOVE_10000">Above ₹10,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedSkuRange">Expected SKU Range (Optional)</Label>
                  <Select
                    value={businessForm.watch("expectedSkuRange")}
                    onValueChange={(value) => businessForm.setValue("expectedSkuRange", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select SKU range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNDER_10">Under 10</SelectItem>
                      <SelectItem value="10_50">10 - 50</SelectItem>
                      <SelectItem value="50_100">50 - 100</SelectItem>
                      <SelectItem value="100_500">100 - 500</SelectItem>
                      <SelectItem value="ABOVE_500">Above 500</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  disabled={isPending}
                >
                  Back
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Complete Onboarding
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
