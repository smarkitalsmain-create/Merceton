"use client"

import React, { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { getPackageFeatures, updatePricingPackageFeatures } from "@/app/actions/features"
import { Save, Info } from "lucide-react"
// Tooltip component not found, using simple info display instead

interface PackageFeaturesEditorProps {
  packageId: string
  packageStatus: string // Only allow editing DRAFT packages
}

interface Feature {
  id: string
  key: string
  name: string
  description: string | null
  category?: string
  valueType: "BOOLEAN" | "NUMBER" | "STRING" | "JSON"
  enabled: boolean
  valueJson: any
}

export function PackageFeaturesEditor({
  packageId,
  packageStatus,
}: PackageFeaturesEditorProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState("")

  const isDraft = packageStatus === "DRAFT"

  const loadFeatures = React.useCallback(async () => {
    if (!packageId) return
    try {
      setLoading(true)
      const data = await getPackageFeatures(packageId)
      setFeatures(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load features",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [packageId, toast])

  useEffect(() => {
    loadFeatures()
  }, [loadFeatures])

  function handleFeatureToggle(featureId: string, enabled: boolean) {
    setFeatures((prev) =>
      prev.map((f) => (f.id === featureId ? { ...f, enabled } : f))
    )
  }

  function handleFeatureValueChange(featureId: string, value: any) {
    setFeatures((prev) =>
      prev.map((f) => (f.id === featureId ? { ...f, valueJson: value } : f))
    )
  }

  function handleSave() {
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Reason is required for audit logging",
        variant: "destructive",
      })
      return
    }

    if (!isDraft) {
      toast({
        title: "Error",
        description: "Only DRAFT packages can have features updated",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        const featuresToSave = features.map((f) => ({
          featureId: f.id,
          enabled: f.enabled,
          valueJson: f.enabled && f.valueType !== "BOOLEAN" ? f.valueJson : undefined,
        }))

        const result = await updatePricingPackageFeatures(
          packageId,
          featuresToSave,
          reason
        )

        if (result.success) {
          toast({
            title: "Success",
            description: "Package features updated successfully",
          })
          setReason("")
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to update features",
          variant: "destructive",
        })
      }
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>Loading features...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // All features are Growth-only (9). Group by category.
  const byCategory = features.reduce<Record<string, typeof features>>((acc, f) => {
    const cat = f.category ?? "other"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(f)
    return acc
  }, {})
  const categories = Object.keys(byCategory).sort()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Package Features</CardTitle>
        <CardDescription>
          {isDraft
            ? "Enable features for this package. Only DRAFT packages can be edited."
            : "Features can only be edited for DRAFT packages."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isDraft && (
          <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
            <p className="text-sm text-yellow-800">
              This package is {packageStatus}. Features can only be edited for DRAFT
              packages. Use &quot;Duplicate &amp; Edit&quot; to create a new DRAFT version.
            </p>
          </div>
        )}

        {categories.map((cat) => (
          <div key={cat} className="space-y-4 border-t pt-6 first:border-t-0 first:pt-0">
            <h3 className="text-sm font-semibold text-muted-foreground capitalize">
              {cat}
            </h3>
            {byCategory[cat].map((feature) => (
              <FeatureRow
                key={feature.id}
                feature={feature}
                disabled={!isDraft}
                onToggle={handleFeatureToggle}
                onValueChange={handleFeatureValueChange}
              />
            ))}
          </div>
        ))}

        {isDraft && (
          <>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Update *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Required for audit logging"
                required
                rows={2}
              />
            </div>

            <Button onClick={handleSave} disabled={isPending || !reason.trim()}>
              <Save className="h-4 w-4 mr-2" />
              {isPending ? "Saving..." : "Save Features"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function FeatureRow({
  feature,
  disabled,
  onToggle,
  onValueChange,
}: {
  feature: Feature
  disabled: boolean
  onToggle: (featureId: string, enabled: boolean) => void
  onValueChange: (featureId: string, value: any) => void
}) {
  const showValueInput =
    feature.enabled &&
    feature.valueType !== "BOOLEAN" &&
    (feature.valueType === "NUMBER" || feature.valueType === "STRING")

  // Special handling for PRODUCT_LIMIT
  const isProductLimit = feature.key === "PRODUCT_LIMIT"
  const hasUnlimited = false // Would need to check if UNLIMITED_PRODUCTS is enabled

  return (
    <div className="flex items-start justify-between gap-4 p-3 rounded-lg border">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Label htmlFor={`feature-${feature.id}`} className="font-medium">
            {feature.name}
          </Label>
          {feature.description && (
            <span className="text-xs text-muted-foreground" title={feature.description}>
              <Info className="h-4 w-4 text-muted-foreground" />
            </span>
          )}
        </div>
        {feature.description && (
          <p className="text-xs text-muted-foreground">{feature.description}</p>
        )}

        {showValueInput && (
          <div className="mt-2">
            {feature.valueType === "NUMBER" ? (
              <Input
                type="number"
                value={feature.valueJson ?? ""}
                onChange={(e) =>
                  onValueChange(
                    feature.id,
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                disabled={disabled}
                placeholder="Enter value"
                className="w-32"
              />
            ) : (
              <Input
                type="text"
                value={feature.valueJson ?? ""}
                onChange={(e) => onValueChange(feature.id, e.target.value)}
                disabled={disabled}
                placeholder="Enter value"
                className="w-64"
              />
            )}
          </div>
        )}

      </div>

      <Switch
        id={`feature-${feature.id}`}
        checked={feature.enabled}
        onCheckedChange={(checked) => onToggle(feature.id, checked)}
        disabled={disabled}
      />
    </div>
  )
}
