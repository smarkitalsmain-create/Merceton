"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Save, ExternalLink } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface InvoiceSettingsData {
  invoicePrefix: string
  invoiceNextNumber: number
  invoiceNumberPadding: number
  invoiceSeriesFormat?: string
  resetFy: boolean
}

interface InvoiceSettingsFormProps {
  initialData: {
    invoicePrefix: string
    invoiceNextNumber: number
    invoiceNumberPadding: number
    invoiceSeriesFormat: string
    resetFy: boolean
    logoUrl: string | null
  }
}

export function InvoiceSettingsForm({ initialData }: InvoiceSettingsFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, setIsPending] = useState(false)

  const form = useForm<InvoiceSettingsData>({
    defaultValues: {
      invoicePrefix: initialData.invoicePrefix,
      invoiceNextNumber: initialData.invoiceNextNumber,
      invoiceNumberPadding: initialData.invoiceNumberPadding,
      invoiceSeriesFormat: initialData.invoiceSeriesFormat,
      resetFy: initialData.resetFy,
    },
  })

  const handleSubmit = async (data: InvoiceSettingsData) => {
    // Manual validation
    const errors: string[] = []

    // Validate invoicePrefix
    if (!data.invoicePrefix || data.invoicePrefix.trim().length === 0) {
      errors.push("Prefix is required")
    } else if (data.invoicePrefix.length > 10) {
      errors.push("Prefix must be 10 characters or less")
    }

    // Validate invoiceNextNumber
    const nextNumber = typeof data.invoiceNextNumber === "number" 
      ? data.invoiceNextNumber 
      : parseInt(String(data.invoiceNextNumber || "1"), 10)
    
    if (isNaN(nextNumber) || nextNumber < 1) {
      errors.push("Next invoice number must be at least 1")
    }

    // Validate invoiceNumberPadding
    const padding = typeof data.invoiceNumberPadding === "number"
      ? data.invoiceNumberPadding
      : parseInt(String(data.invoiceNumberPadding || "5"), 10)
    
    if (isNaN(padding) || padding < 3 || padding > 8) {
      errors.push("Number padding must be between 3 and 8")
    }

    // Validate invoiceSeriesFormat (if provided)
    if (data.invoiceSeriesFormat && data.invoiceSeriesFormat.trim().length > 0) {
      if (!data.invoiceSeriesFormat.includes("{NNNNN}")) {
        errors.push("Series format must include {NNNNN} token")
      }
    }

    // Show validation errors
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors[0],
        variant: "destructive",
      })
      return
    }

    // Prepare validated data with proper number types
    const payload = {
      invoicePrefix: data.invoicePrefix.trim().toUpperCase(),
      invoiceNextNumber: nextNumber,
      invoiceNumberPadding: padding,
      invoiceSeriesFormat: data.invoiceSeriesFormat?.trim() || undefined,
      resetFy: data.resetFy || false,
    }

    setIsPending(true)
    try {
      const response = await fetch("/api/settings/invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: "Error",
          description: result.error || "Failed to update invoice settings",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Invoice settings updated",
        description: "Your invoice settings have been saved successfully.",
      })
      router.refresh()
    } catch (error) {
      console.error("Save invoice settings error:", error)
      toast({
        title: "Error",
        description: "Failed to update invoice settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPending(false)
    }
  }

  // Preview invoice number format
  const prefix = form.watch("invoicePrefix") || "MRC"
  const padding = form.watch("invoiceNumberPadding") || 5
  const format = form.watch("invoiceSeriesFormat") || "{PREFIX}-{YYYY}-{NNNNN}"
  const year = new Date().getFullYear()
  const previewNumber = format
    .replace("{PREFIX}", prefix.toUpperCase())
    .replace("{YYYY}", String(year))
    .replace("{NNNNN}", String(initialData.invoiceNextNumber).padStart(padding, "0"))

  return (
    <div className="space-y-6">
      {/* Invoice Numbering */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Numbering</CardTitle>
          <CardDescription>
            Configure how invoice numbers are generated and formatted.
            <span className="block mt-1 text-xs text-amber-600">
              Note: Changes apply to new invoices only. Existing invoice numbers won&apos;t change.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoicePrefix">Prefix *</Label>
                <Input
                  id="invoicePrefix"
                  {...form.register("invoicePrefix")}
                  placeholder="MRC"
                  maxLength={10}
                  className="uppercase"
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase()
                    form.setValue("invoicePrefix", e.target.value)
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Uppercase recommended (e.g., MRC, INV, BILL)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceNextNumber">Next Invoice Number *</Label>
                <Input
                  id="invoiceNextNumber"
                  type="number"
                  {...form.register("invoiceNextNumber", { valueAsNumber: true })}
                  min={1}
                />
                <p className="text-xs text-muted-foreground">
                  Starting sequence number for new invoices
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumberPadding">Number Padding *</Label>
                <Input
                  id="invoiceNumberPadding"
                  type="number"
                  {...form.register("invoiceNumberPadding", { valueAsNumber: true })}
                  min={3}
                  max={8}
                />
                <p className="text-xs text-muted-foreground">
                  Number of digits for sequence (3-8, e.g., 5 = 00001)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resetFy">Reset Each Financial Year</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="resetFy"
                    checked={form.watch("resetFy")}
                    onChange={(e) => form.setValue("resetFy", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  />
                  <Label htmlFor="resetFy" className="text-sm font-normal cursor-pointer">
                    Reset sequence to 1 each year
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceSeriesFormat">Series Format (Optional)</Label>
              <Input
                id="invoiceSeriesFormat"
                {...form.register("invoiceSeriesFormat")}
                placeholder="{PREFIX}-{YYYY}-{NNNNN}"
              />
              <p className="text-xs text-muted-foreground">
                Available tokens: <code className="bg-muted px-1 rounded">{"{PREFIX}"}</code>,{" "}
                <code className="bg-muted px-1 rounded">{"{YYYY}"}</code>,{" "}
                <code className="bg-muted px-1 rounded">{"{NNNNN}"}</code>
              </p>
              <p className="text-xs text-muted-foreground">
                Example: <code className="bg-muted px-1 rounded">{previewNumber}</code>
              </p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Save className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Invoice Branding */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Branding</CardTitle>
          <CardDescription>
            Logo displayed on invoices. This is shared with your storefront branding.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {initialData.logoUrl ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="border rounded p-2 bg-gray-50">
                  <Image
                    src={initialData.logoUrl}
                    alt="Current logo"
                    width={120}
                    height={60}
                    className="h-auto max-h-16 w-auto object-contain"
                    unoptimized
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Current Logo</p>
                  <p className="text-xs text-muted-foreground">
                    This logo will appear on all invoices
                  </p>
                </div>
              </div>
              <Link href="/dashboard/storefront?tab=branding">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Edit Storefront Logo
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                No logo configured. Add a logo in your storefront branding settings.
              </p>
              <Link href="/dashboard/storefront?tab=branding">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Configure Storefront Logo
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
