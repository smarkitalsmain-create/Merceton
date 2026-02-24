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
import { savePanStep, saveOnboardingStep, saveBusinessStep, type OnboardingResponse } from "@/app/actions/onboarding"
import {
  panStepSchema,
  gstStepSchema,
  gstStepSchemaBase,
  businessStepSchema,
  invoiceStepSchema,
  type PanStepData,
  type GstStepData,
  type GstWithInvoiceStepData,
  type BusinessStepData,
  type InvoiceStepData,
} from "@/lib/validation/onboarding-steps"
import { Loader2, CheckCircle2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { toDateInputValue } from "@/lib/dateUtils"

interface OnboardingFormProps {
  initialData: {
    onboardingStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"
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
    invoiceAddressLine1?: string | null
    invoiceAddressLine2?: string | null
    invoiceCity?: string | null
    invoicePincode?: string | null
    invoiceState?: string | null
    invoicePhone?: string | null
    invoiceEmail?: string | null
    invoicePrefix?: string | null
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
  
  // Determine initial step based on onboardingStatus and field completion
  const [currentStep, setCurrentStep] = useState<Step>(() => {
    // CRITICAL: If onboarding is already completed, redirect to dashboard (backup guard)
    if (initialData.onboardingStatus === "COMPLETED") {
      // Use replace to avoid adding to history
      if (typeof window !== "undefined") {
        router.replace("/dashboard")
      }
      return 3 // Return step 3 as fallback, but redirect should happen
    }

    // Step determination logic based on completion status
    // Step 1: PAN step
    if (!initialData.panNumber) {
      return 1
    }

    // Step 2: GST/Invoice step
    // Check if GST step is incomplete
    const gstIncomplete = 
      !initialData.gstStatus || 
      (initialData.gstStatus === "NOT_REGISTERED" && !initialData.gstNotRegisteredReason) ||
      (initialData.gstStatus === "REGISTERED" && (!initialData.gstin || !initialData.gstLegalName || !initialData.gstState))
    
    // Check if invoice step is incomplete
    const invoiceIncomplete = 
      !initialData.invoiceAddressLine1 || 
      !initialData.invoiceCity || 
      !initialData.invoicePincode || 
      !initialData.invoiceState

    if (gstIncomplete || invoiceIncomplete) {
      return 2
    }

    // Step 3: Business Basics step
    // If all previous steps are complete, go to step 3
    return 3
  })
  const [isPending, startTransition] = useTransition()

  // Step 1: PAN Form
  // Form uses string for date input, Zod will coerce to Date on submit
  const panForm = useForm<PanStepData>({
    resolver: zodResolver(panStepSchema),
    mode: "onChange", // Clear errors as user types
    defaultValues: {
      panType: (initialData.panType as any) || undefined,
      panNumber: initialData.panNumber || "",
      panName: initialData.panName || "",
      // Convert Date to string for date input (Zod z.coerce.date() will convert back to Date on submit)
      panDobOrIncorp: (toDateInputValue(initialData.panDobOrIncorp) || undefined) as any,
      panHolderRole: initialData.panHolderRole || "",
    },
  })

  // Step 2: GST Form (includes invoice fields in UI, but validates separately)
  // Frontend form accepts both GST and invoice fields, backend validates separately
  // Use combined schema for client-side validation of both GST and invoice fields
  // Use base schema for merge (ZodEffects can't be merged directly)
  const gstWithInvoiceSchema = gstStepSchemaBase.merge(invoiceStepSchema)
  
  const gstForm = useForm<GstWithInvoiceStepData>({
    // Use combined schema for client-side validation
    resolver: zodResolver(gstWithInvoiceSchema),
    mode: "onChange", // Clear errors as user types
    reValidateMode: "onChange", // Re-validate on change
    defaultValues: {
      gstStatus: (initialData.gstStatus as any) || "NOT_REGISTERED",
      gstin: initialData.gstin || "",
      gstLegalName: initialData.gstLegalName || "",
      gstTradeName: initialData.gstTradeName || "",
      gstState: initialData.gstState || "",
      gstComposition: initialData.gstComposition || false,
      gstNotRegisteredReason: initialData.gstNotRegisteredReason || "",
      invoiceAddressLine1: initialData.invoiceAddressLine1 || "",
      invoiceAddressLine2: initialData.invoiceAddressLine2 || "",
      invoiceCity: initialData.invoiceCity || "",
      invoicePincode: initialData.invoicePincode || "",
      invoiceState: initialData.invoiceState || "",
      invoicePhone: initialData.invoicePhone || "",
      invoiceEmail: initialData.invoiceEmail || "",
      invoicePrefix: initialData.invoicePrefix || "MRC",
    },
  })

  // Step 3: Business Basics Form
  const businessForm = useForm<BusinessStepData>({
    resolver: zodResolver(businessStepSchema),
    mode: "onChange", // Clear errors as user types
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
    // DEV-only log
    if (process.env.NODE_ENV === "development") {
      console.log("[onboarding] Save & Continue clicked - PAN step")
      console.log("[onboarding] Validated data:", data)
    }

    startTransition(async () => {
      // DEV-only log
      if (process.env.NODE_ENV === "development") {
        console.log("[onboarding] Sending payload to savePanStep:", data)
      }

      try {
        const result = await savePanStep(data)

        // DEV-only log
        if (process.env.NODE_ENV === "development") {
          console.log("[onboarding] API response status: success =", result.success)
          console.log("[onboarding] API response data:", result)
        }

        // Handle response based on success flag
        if (result.success) {
          // Success path - never show "Invalid data format"
          toast({
            title: "PAN details saved",
            description: "Step 1 completed successfully.",
          })
          setCurrentStep(2)
        } else {
          // Error path - handle field errors and show appropriate message
          // Handle field-level errors from server
          if (result.fieldErrors) {
            for (const [field, message] of Object.entries(result.fieldErrors)) {
              panForm.setError(field as keyof PanStepData, {
                type: "server",
                message,
              })
            }
          }
          // Show toast with appropriate message
          if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
            toast({
              title: "Please fix highlighted fields",
              description: "Check the fields marked in red below",
              variant: "destructive",
            })
          } else {
            // Never show "Invalid data format" - replace with user-friendly message
            const errorMessage = result.error || "Failed to save PAN details"
            const displayMessage = errorMessage.includes("Invalid data format")
              ? "Validation failed. Please check all fields and try again."
              : errorMessage
            toast({
              title: "Error",
              description: displayMessage,
              variant: "destructive",
            })
          }
        }
      } catch (error) {
        // DEV-only log
        if (process.env.NODE_ENV === "development") {
          console.error("[onboarding] Error calling savePanStep:", error)
        }
        // Never show "Invalid data format" - show actual error or generic message
        const errorMessage = error instanceof Error ? error.message : "Failed to save PAN details"
        toast({
          title: "Error",
          description: errorMessage.includes("Invalid data format") 
            ? "Validation failed. Please check the fields below."
            : errorMessage,
          variant: "destructive",
        })
      }
    })
  }

  // Handle client-side validation errors
  const handlePanSubmitError = (errors: any) => {
    // DEV-only log
    if (process.env.NODE_ENV === "development") {
      console.log("[onboarding] Client-side validation failed - preventing API call")
      console.log("[onboarding] Validation errors:", errors)
    }

    // React Hook Form already sets errors on fields, map them properly
    const errorFields = Object.keys(errors)
    if (errorFields.length > 0) {
      // Map errors to form fields for better UX
      for (const [field, error] of Object.entries(errors)) {
        if (error && typeof error === "object" && "message" in error) {
          panForm.setError(field as keyof PanStepData, {
            type: "validation",
            message: (error as any).message || "Invalid value",
          })
        }
      }
      
      toast({
        title: "Please fix highlighted fields",
        description: "Check the fields marked in red below",
        variant: "destructive",
      })
    }
  }

  const handleGstSubmit = (data: GstWithInvoiceStepData) => {
    // Extract invoice fields only for invoice step submission
    const invoicePayload = {
      invoiceAddressLine1: data.invoiceAddressLine1 || "",
      invoiceAddressLine2: data.invoiceAddressLine2 || "",
      invoiceCity: data.invoiceCity || "",
      invoicePincode: data.invoicePincode || "",
      invoiceState: data.invoiceState || "",
      invoicePhone: data.invoicePhone || "",
      invoiceEmail: data.invoiceEmail || "",
      invoicePrefix: data.invoicePrefix || "",
      step: "invoice" as const,
    }

    // DEV-only log - confirm actual submitted values
    if (process.env.NODE_ENV === "development") {
      console.log("[onboarding] Invoice submit - Form values:", gstForm.getValues())
      console.log("[onboarding] Invoice submit - Validated data:", data)
      console.log("[onboarding] Invoice submit - Invoice payload:", invoicePayload)
      console.log("[onboarding] Invoice submit - Payload keys:", Object.keys(invoicePayload))
    }

    startTransition(async () => {
      try {
        // Send invoice payload with step parameter
        const result = await saveOnboardingStep(invoicePayload)

        // DEV-only log
        if (process.env.NODE_ENV === "development") {
          console.log("[onboarding] API response status: success =", result.success)
          console.log("[onboarding] API response data:", result)
        }

        // Handle invoice step response
        if (result.success) {
          // Success path - proceed to next step
          toast({
            title: "Step 2 completed",
            description: "GST and invoice details saved successfully.",
          })
          setCurrentStep(3)
        } else {
          // Error path - handle field errors and show appropriate message
          if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
            // Map field errors to form fields
            for (const [field, message] of Object.entries(result.fieldErrors)) {
              gstForm.setError(field as keyof GstWithInvoiceStepData, {
                type: "server",
                message: String(message),
              })
            }
            toast({
              title: "Please fix highlighted fields",
              description: result.error || "Check the fields marked in red below",
              variant: "destructive",
            })
          } else {
            toast({
              title: "Error",
              description: result.error || "Failed to save invoice details",
              variant: "destructive",
            })
          }
        }
      } catch (error) {
        // DEV-only log
        if (process.env.NODE_ENV === "development") {
          console.error("[onboarding] Error calling saveGstStep:", error)
        }
        // Never show "Invalid data format" - show actual error or generic message
        const errorMessage = error instanceof Error ? error.message : "Failed to save GST details"
        toast({
          title: "Error",
          description: errorMessage.includes("Invalid data format") 
            ? "Validation failed. Please check the fields below."
            : errorMessage,
          variant: "destructive",
        })
      }
    })
  }

  // Handle client-side validation errors
  const handleGstSubmitError = (errors: any) => {
    // DEV-only log
    if (process.env.NODE_ENV === "development") {
      console.log("[onboarding] Client-side validation failed - preventing API call")
      console.log("[onboarding] Validation errors:", errors)
      console.log("[onboarding] Form state errors:", gstForm.formState.errors)
    }

    // React Hook Form already sets errors on fields, just show toast
    const errorFields = Object.keys(errors)
    if (errorFields.length > 0) {
      // Map errors to form fields for better UX
      for (const [field, error] of Object.entries(errors)) {
        if (error && typeof error === "object" && "message" in error) {
          gstForm.setError(field as keyof GstStepData, {
            type: "validation",
            message: (error as any).message || "Invalid value",
          })
        }
      }
      
      toast({
        title: "Please fix highlighted fields",
        description: "Check the fields marked in red below",
        variant: "destructive",
      })
    }
  }

  const handleBusinessSubmit = (data: BusinessStepData) => {
    // DEV-only log
    if (process.env.NODE_ENV === "development") {
      console.log("[onboarding] Save & Continue clicked - Business step")
      console.log("[onboarding] Validated data:", data)
    }

    startTransition(async () => {
      // DEV-only log
      if (process.env.NODE_ENV === "development") {
        console.log("[onboarding] Sending payload to saveBusinessBasicsStep:", data)
      }

      try {
        const result = await saveBusinessStep(data)

        // DEV-only log
        if (process.env.NODE_ENV === "development") {
          console.log("[onboarding] API response status: success =", result.success)
          console.log("[onboarding] API response data:", result)
        }

        // Handle response based on success flag
        if (result.success) {
          // DEV-only log
          if (process.env.NODE_ENV === "development") {
            console.log("[onboarding] Business step completed successfully")
            console.log("[onboarding] Onboarding status:", result.onboarding?.onboardingStatus)
          }

          // Success path - immediately redirect to dashboard
          // Use replace to avoid adding to history and prevent back navigation
          toast({
            title: "Onboarding completed!",
            description: "Your profile is now complete. Redirecting to dashboard...",
          })
          
          // Immediate redirect without setTimeout or refresh
          router.replace("/dashboard")
        } else {
          // Error path - handle field errors and show appropriate message
          // Handle field-level errors from server
          if (result.fieldErrors) {
            for (const [field, message] of Object.entries(result.fieldErrors)) {
              businessForm.setError(field as keyof BusinessStepData, {
                type: "server",
                message,
              })
            }
          }
          // Show toast with appropriate message
          if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
            toast({
              title: "Please fix highlighted fields",
              description: "Check the fields marked in red below",
              variant: "destructive",
            })
          } else {
            // Never show "Invalid data format" - replace with user-friendly message
            const errorMessage = result.error || "Failed to save business details"
            const displayMessage = errorMessage.includes("Invalid data format")
              ? "Validation failed. Please check all fields and try again."
              : errorMessage
            toast({
              title: "Error",
              description: displayMessage,
              variant: "destructive",
            })
          }
        }
      } catch (error) {
        // DEV-only log
        if (process.env.NODE_ENV === "development") {
          console.error("[onboarding] Error calling saveBusinessBasicsStep:", error)
        }
        // Never show "Invalid data format" - show actual error or generic message
        const errorMessage = error instanceof Error ? error.message : "Failed to save business details"
        toast({
          title: "Error",
          description: errorMessage.includes("Invalid data format") 
            ? "Validation failed. Please check the fields below."
            : errorMessage,
          variant: "destructive",
        })
      }
    })
  }

  // Handle client-side validation errors
  const handleBusinessSubmitError = (errors: any) => {
    // DEV-only log
    if (process.env.NODE_ENV === "development") {
      console.log("[onboarding] Client-side validation failed - preventing API call")
      console.log("[onboarding] Validation errors:", errors)
    }

    // React Hook Form already sets errors on fields, map them properly
    const errorFields = Object.keys(errors)
    if (errorFields.length > 0) {
      // Map errors to form fields for better UX
      for (const [field, error] of Object.entries(errors)) {
        if (error && typeof error === "object" && "message" in error) {
          businessForm.setError(field as keyof BusinessStepData, {
            type: "validation",
            message: (error as any).message || "Invalid value",
          })
        }
      }
      
      toast({
        title: "Please fix highlighted fields",
        description: "Check the fields marked in red below",
        variant: "destructive",
      })
    }
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
            <form
              onSubmit={panForm.handleSubmit(handlePanSubmit, handlePanSubmitError)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="panType">PAN Type *</Label>
                <Select
                  value={panForm.watch("panType")}
                  onValueChange={(value) => panForm.setValue("panType", value as any)}
                >
                  <SelectTrigger
                    className={
                      panForm.formState.errors.panType
                        ? "border-destructive focus:ring-destructive"
                        : ""
                    }
                  >
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
                  className={`uppercase ${
                    panForm.formState.errors.panNumber
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }`}
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
                  className={
                    panForm.formState.errors.panName
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
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
                  className={
                    panForm.formState.errors.panDobOrIncorp
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
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
                  className={
                    panForm.formState.errors.panHolderRole
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
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
            <form
              onSubmit={gstForm.handleSubmit(handleGstSubmit, handleGstSubmitError)}
              className="space-y-4"
            >
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
                  <SelectTrigger
                    className={
                      gstForm.formState.errors.gstStatus
                        ? "border-destructive focus:ring-destructive"
                        : ""
                    }
                  >
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
                      className={
                        gstForm.formState.errors.gstState
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
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

              {/* Invoice/Billing Address Section */}
              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">Invoice/Billing Address</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceAddressLine1">Address Line 1 *</Label>
                    <Input
                      id="invoiceAddressLine1"
                      {...gstForm.register("invoiceAddressLine1", {
                        onChange: () => {
                          gstForm.clearErrors("invoiceAddressLine1")
                        },
                      })}
                      placeholder="Street address, building name"
                      className={
                        gstForm.formState.errors.invoiceAddressLine1
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                    />
                    {gstForm.formState.errors.invoiceAddressLine1 && (
                      <p className="text-sm text-destructive">
                        {gstForm.formState.errors.invoiceAddressLine1.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invoiceAddressLine2">Address Line 2 (Optional)</Label>
                    <Input
                      id="invoiceAddressLine2"
                      {...gstForm.register("invoiceAddressLine2", {
                        onChange: () => {
                          gstForm.clearErrors("invoiceAddressLine2")
                        },
                      })}
                      placeholder="Apartment, suite, unit, etc."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="invoiceCity">City *</Label>
                      <Input
                        id="invoiceCity"
                        {...gstForm.register("invoiceCity", {
                          onChange: () => {
                            gstForm.clearErrors("invoiceCity")
                          },
                        })}
                        placeholder="City"
                        className={
                          gstForm.formState.errors.invoiceCity
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                      />
                      {gstForm.formState.errors.invoiceCity && (
                        <p className="text-sm text-destructive">
                          {gstForm.formState.errors.invoiceCity.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="invoicePincode">Pincode *</Label>
                      <Input
                        id="invoicePincode"
                        {...gstForm.register("invoicePincode", {
                          onChange: () => {
                            gstForm.clearErrors("invoicePincode")
                          },
                        })}
                        placeholder="6 digits"
                        maxLength={6}
                        pattern="[0-9]{6}"
                        className={
                          gstForm.formState.errors.invoicePincode
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                      />
                      {gstForm.formState.errors.invoicePincode && (
                        <p className="text-sm text-destructive">
                          {gstForm.formState.errors.invoicePincode.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invoiceState">State *</Label>
                    <Input
                      id="invoiceState"
                      {...gstForm.register("invoiceState", {
                        onChange: () => {
                          gstForm.clearErrors("invoiceState")
                        },
                      })}
                      placeholder="State"
                      className={
                        gstForm.formState.errors.invoiceState
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                    />
                    {gstForm.formState.errors.invoiceState && (
                      <p className="text-sm text-destructive">
                        {gstForm.formState.errors.invoiceState.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="invoicePhone">Phone (Optional)</Label>
                      <Input
                        id="invoicePhone"
                        {...gstForm.register("invoicePhone", {
                          onChange: () => {
                            gstForm.clearErrors("invoicePhone")
                          },
                        })}
                        placeholder="Phone number"
                        type="tel"
                        className={
                          gstForm.formState.errors.invoicePhone
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                      />
                      {gstForm.formState.errors.invoicePhone && (
                        <p className="text-sm text-destructive">
                          {gstForm.formState.errors.invoicePhone.message}
                        </p>
                      )}
                    </div>

                      <div className="space-y-2">
                        <Label htmlFor="invoiceEmail">Email (Optional)</Label>
                        <Input
                          id="invoiceEmail"
                          {...gstForm.register("invoiceEmail", {
                            onChange: () => {
                              gstForm.clearErrors("invoiceEmail")
                            },
                          })}
                          placeholder="email@example.com"
                          type="email"
                          className={
                            gstForm.formState.errors.invoiceEmail
                              ? "border-destructive focus-visible:ring-destructive"
                              : ""
                          }
                        />
                        {gstForm.formState.errors.invoiceEmail && (
                          <p className="text-sm text-destructive">
                            {gstForm.formState.errors.invoiceEmail.message}
                          </p>
                        )}
                      </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invoicePrefix">Invoice Number Prefix (Optional)</Label>
                    <Input
                      id="invoicePrefix"
                      {...gstForm.register("invoicePrefix", {
                        onChange: () => {
                          gstForm.clearErrors("invoicePrefix")
                        },
                      })}
                      placeholder="MRC"
                      maxLength={8}
                      className={
                        gstForm.formState.errors.invoicePrefix
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                    />
                    {gstForm.formState.errors.invoicePrefix && (
                      <p className="text-sm text-destructive">
                        {gstForm.formState.errors.invoicePrefix.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Prefix for invoice numbers (e.g., MRC-2024-00001). Max 8 characters, alphanumeric only.
                    </p>
                  </div>
                </div>
              </div>

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
            <form
              onSubmit={businessForm.handleSubmit(handleBusinessSubmit, handleBusinessSubmitError)}
              className="space-y-4"
            >
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
