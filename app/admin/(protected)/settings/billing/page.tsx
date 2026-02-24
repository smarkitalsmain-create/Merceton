"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface BillingProfile {
  id: string
  legalName: string
  gstin?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  state?: string | null
  pincode?: string | null
  email?: string | null
  phone?: string | null
  invoicePrefix: string
  invoiceNextNumber: number
  invoicePadding: number
  seriesFormat: string
  defaultSacCode: string
  defaultGstRate: number
  footerNote?: string | null
}

interface DebugInfo {
  status?: number
  url?: string
  bodyText?: string
  json?: any
  errorMessage?: string
}

export default function BillingProfilePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<BillingProfile | null>(null)
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const isDevelopment = process.env.NODE_ENV === "development"

  const loadProfile = useCallback(async () => {
    const url = "/api/admin/billing-profile"
    try {
      const res = await fetch(url)
      
      // Capture debug info
      const debug: DebugInfo = {
        status: res.status,
        url,
      }

      if (!res.ok) {
        // Try to read response body
        try {
          const text = await res.text()
          debug.bodyText = text
          try {
            debug.json = JSON.parse(text)
          } catch {
            // Not JSON, keep as text
          }
        } catch (e) {
          debug.errorMessage = "Could not read response body"
        }
        
        setDebugInfo(debug)
        
        const errorMessage =
          debug.json?.detail || debug.json?.error || debug.bodyText || "Failed to load profile"
        
        toast({
          title: "Error",
          description: `Failed to load billing profile (${res.status}): ${errorMessage}`,
          variant: "destructive",
        })
        return
      }

      const data = await res.json()
      setProfile(data)
      setDebugInfo(null) // Clear debug info on success
    } catch (error: any) {
      console.error("Error loading profile:", error)
      
      const debug: DebugInfo = {
        status: undefined,
        url,
        errorMessage: error?.message || String(error),
      }
      setDebugInfo(debug)
      
      toast({
        title: "Error",
        description: `Failed to load billing profile: ${error?.message || "Network error"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    try {
      const formData = new FormData(e.currentTarget)
      const data: Partial<BillingProfile> = {
        legalName: formData.get("legalName") as string,
        gstin: formData.get("gstin") as string || null,
        addressLine1: formData.get("addressLine1") as string || null,
        addressLine2: formData.get("addressLine2") as string || null,
        city: formData.get("city") as string || null,
        state: formData.get("state") as string || null,
        pincode: formData.get("pincode") as string || null,
        email: formData.get("email") as string || null,
        phone: formData.get("phone") as string || null,
        invoicePrefix: formData.get("invoicePrefix") as string,
        invoiceNextNumber: parseInt(formData.get("invoiceNextNumber") as string) || 1,
        invoicePadding: parseInt(formData.get("invoicePadding") as string) || 5,
        seriesFormat: formData.get("seriesFormat") as string,
        defaultSacCode: formData.get("defaultSacCode") as string,
        defaultGstRate: parseFloat(formData.get("defaultGstRate") as string) || 18,
        footerNote: formData.get("footerNote") as string || null,
      }

      const res = await fetch("/api/admin/billing-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        // Capture debug info
        const debug: DebugInfo = {
          status: res.status,
          url: "/api/admin/billing-profile",
        }
        
        try {
          const text = await res.text()
          debug.bodyText = text
          try {
            debug.json = JSON.parse(text)
          } catch {
            // Not JSON
          }
        } catch (e) {
          debug.errorMessage = "Could not read response body"
        }
        
        setDebugInfo(debug)
        
        const errorMessage =
          debug.json?.detail || debug.json?.error || debug.bodyText || "Failed to save"
        
        throw new Error(`Save failed (${res.status}): ${errorMessage}`)
      }

      const updated = await res.json()
      setProfile(updated)
      setDebugInfo(null) // Clear debug info on success

      toast({
        title: "Success",
        description: "Billing profile updated successfully",
      })
    } catch (error: any) {
      console.error("Error saving profile:", error)
      
      if (!debugInfo) {
        setDebugInfo({
          status: undefined,
          url: "/api/admin/billing-profile",
          errorMessage: error?.message || String(error),
        })
      }
      
      toast({
        title: "Error",
        description: `Failed to save billing profile: ${error?.message || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Platform Billing Profile</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Platform Billing Profile</h1>
          <p className="text-muted-foreground">Failed to load profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Billing Profile</h1>
        <p className="text-muted-foreground">
          Configure Smarkitals Technologies India Pvt Ltd billing details for platform invoices
        </p>
      </div>

      {/* Debug Panel - Only in development */}
      {isDevelopment && debugInfo && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="text-yellow-800 dark:text-yellow-200">
              Debug Information
            </CardTitle>
            <CardDescription>Error details for debugging</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="font-semibold">Status:</span>{" "}
              {debugInfo.status ?? "N/A"}
            </div>
            <div>
              <span className="font-semibold">URL:</span> {debugInfo.url}
            </div>
            {debugInfo.errorMessage && (
              <div>
                <span className="font-semibold">Error:</span>{" "}
                {debugInfo.errorMessage}
              </div>
            )}
            {debugInfo.json && (
              <div>
                <span className="font-semibold">Response JSON:</span>
                <pre className="mt-1 overflow-auto rounded bg-white p-2 text-xs dark:bg-gray-900">
                  {JSON.stringify(debugInfo.json, null, 2)}
                </pre>
              </div>
            )}
            {debugInfo.bodyText && !debugInfo.json && (
              <div>
                <span className="font-semibold">Response Body:</span>
                <pre className="mt-1 overflow-auto rounded bg-white p-2 text-xs dark:bg-gray-900">
                  {debugInfo.bodyText.substring(0, 500)}
                  {debugInfo.bodyText.length > 500 ? "..." : ""}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
            <CardDescription>Legal name and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="legalName">Legal Name *</Label>
              <Input
                id="legalName"
                name="legalName"
                defaultValue={profile.legalName}
                required
              />
            </div>
            <div>
              <Label htmlFor="gstin">GSTIN</Label>
              <Input
                id="gstin"
                name="gstin"
                defaultValue={profile.gstin || ""}
                placeholder="29ABCDE1234F1Z5"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="addressLine1">Address Line 1</Label>
                <Input
                  id="addressLine1"
                  name="addressLine1"
                  defaultValue={profile.addressLine1 || ""}
                />
              </div>
              <div>
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input
                  id="addressLine2"
                  name="addressLine2"
                  defaultValue={profile.addressLine2 || ""}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  defaultValue={profile.city || ""}
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  defaultValue={profile.state || ""}
                />
              </div>
              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  name="pincode"
                  defaultValue={profile.pincode || ""}
                  maxLength={6}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={profile.email || ""}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={profile.phone || ""}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Numbering</CardTitle>
            <CardDescription>Configure invoice number series and format</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                <Input
                  id="invoicePrefix"
                  name="invoicePrefix"
                  defaultValue={profile.invoicePrefix}
                  required
                />
              </div>
              <div>
                <Label htmlFor="invoiceNextNumber">Next Invoice Number</Label>
                <Input
                  id="invoiceNextNumber"
                  name="invoiceNextNumber"
                  type="number"
                  defaultValue={profile.invoiceNextNumber}
                  min={1}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="invoicePadding">Number Padding</Label>
                <Input
                  id="invoicePadding"
                  name="invoicePadding"
                  type="number"
                  defaultValue={profile.invoicePadding}
                  min={1}
                  max={10}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Number of digits (e.g., 5 = 00001)
                </p>
              </div>
              <div>
                <Label htmlFor="seriesFormat">Series Format</Label>
                <Input
                  id="seriesFormat"
                  name="seriesFormat"
                  defaultValue={profile.seriesFormat}
                  placeholder="{PREFIX}-{FY}-{NNNNN}"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tokens: {"{PREFIX}"}, {"{FY}"}, {"{NNNNN}"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tax Defaults</CardTitle>
            <CardDescription>Default SAC/HSN codes and GST rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="defaultSacCode">Default SAC Code</Label>
                <Input
                  id="defaultSacCode"
                  name="defaultSacCode"
                  defaultValue={profile.defaultSacCode}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Service Accounting Code (e.g., 9983)
                </p>
              </div>
              <div>
                <Label htmlFor="defaultGstRate">Default GST Rate (%)</Label>
                <Input
                  id="defaultGstRate"
                  name="defaultGstRate"
                  type="number"
                  step="0.01"
                  defaultValue={profile.defaultGstRate}
                  min={0}
                  max={100}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Footer Notes</CardTitle>
            <CardDescription>Additional notes to display on invoice footer</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="footerNote">Footer Note</Label>
              <Textarea
                id="footerNote"
                name="footerNote"
                defaultValue={profile.footerNote || ""}
                rows={4}
                placeholder="e.g., This is a system generated invoice. All rights reserved."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
