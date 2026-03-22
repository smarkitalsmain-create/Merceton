"use client"

import { useEffect, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { WarehouseForm, WarehouseFormValues } from "@/components/logistics/WarehouseForm"

interface WarehouseListProps {}

interface WarehouseApiResult {
  providerWarehouseId: string
  name: string
  contactName: string
  contactPhone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  pincode: string
}

// NOTE: Currently there is no list endpoint for warehouses; this component
// treats the form as "single primary warehouse" for now.
export function WarehouseList(_: WarehouseListProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [initial, setInitial] = useState<WarehouseFormValues | undefined>(undefined)
  const [isLoading, startTransition] = useTransition()

  useEffect(() => {
    // TODO: Once a GET /api/logistics/warehouses route exists, fetch and hydrate here.
    startTransition(async () => {
      // For now, there is no persisted warehouse list, so we leave it empty.
      setInitial(undefined)
    })
  }, [])

  if (isLoading && !initial) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-24 w-full animate-pulse rounded bg-muted" />
      </div>
    )
  }

  if (!initial && !isEditing) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Set up your primary pickup location. This address will be used as the origin
          for shipments with your shipping provider.
        </p>
        <Button type="button" size="sm" onClick={() => setIsEditing(true)}>
          Add pickup location
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {initial && !isEditing && (
        <Card>
          <CardContent className="py-4 text-sm space-y-1">
            <p className="font-medium">{initial.name}</p>
            <p className="text-muted-foreground">
              {initial.addressLine1}
              {initial.addressLine2 ? `, ${initial.addressLine2}` : ""}
            </p>
            <p className="text-muted-foreground">
              {[initial.city, initial.state, initial.pincode].filter(Boolean).join(", ")}
            </p>
            <p className="text-muted-foreground">
              Contact: {initial.contactName} • {initial.contactPhone}
            </p>
            <div className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit pickup location
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isEditing && (
        <WarehouseForm
          initialValues={initial}
          onSaved={() => {
            // In a future iteration, re-fetch from API; for now collapse the form.
            setIsEditing(false)
          }}
        />
      )}
    </div>
  )
}

