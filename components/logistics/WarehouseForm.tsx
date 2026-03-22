"use client"

import { useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export interface WarehouseFormValues {
  id?: string
  name: string
  contactName: string
  contactPhone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  pincode: string
}

interface WarehouseFormProps {
  initialValues?: WarehouseFormValues
  onSaved?: () => void
}

export function WarehouseForm({ initialValues, onSaved }: WarehouseFormProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState<WarehouseFormValues>(
    initialValues ?? {
      name: "",
      contactName: "",
      contactPhone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
    }
  )

  const handleChange =
    (field: keyof WarehouseFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        field === "pincode"
          ? e.target.value.replace(/\D/g, "").slice(0, 6)
          : e.target.value
      setValues((prev) => ({ ...prev, [field]: value }))
    }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const { name, contactName, contactPhone, addressLine1, city, state, pincode } =
      values

    if (!name || !contactName || !contactPhone || !addressLine1 || !city || !state) {
      toast({
        title: "Missing details",
        description:
          "Name, contact, phone, address, city and state are required for a warehouse.",
        variant: "destructive",
      })
      return
    }

    if (!/^\d{6}$/.test(pincode)) {
      toast({
        title: "Invalid pincode",
        description: "Pincode must be a 6-digit Indian postal code.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        const payload = {
          provider: "delhivery",
          name,
          contactName,
          contactPhone,
          addressLine1,
          addressLine2: values.addressLine2 || undefined,
          city,
          state,
          pincode,
        }

        const res = await fetch(
          values.id
            ? `/api/logistics/warehouses/${encodeURIComponent(values.id)}`
            : "/api/logistics/warehouses",
          {
            method: values.id ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        )
        const text = await res.text()
        if (!res.ok) {
          try {
            const data = JSON.parse(text)
            throw new Error(data.error || text || res.statusText)
          } catch (err) {
            if (err instanceof Error) throw err
            throw new Error(text || res.statusText)
          }
        }

        toast({
          title: values.id ? "Warehouse updated" : "Warehouse created",
          description: "Your pickup location has been saved.",
        })
        onSaved?.()
      } catch (error) {
        console.error("[WarehouseForm] Failed to save warehouse:", error)
        toast({
          title: "Failed to save warehouse",
          description:
            error instanceof Error ? error.message : "Please try again or contact support.",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="wh-name">Location name</Label>
          <Input
            id="wh-name"
            value={values.name}
            onChange={handleChange("name")}
            placeholder="Main Warehouse"
            disabled={isPending}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="wh-contact-name">Contact name</Label>
          <Input
            id="wh-contact-name"
            value={values.contactName}
            onChange={handleChange("contactName")}
            placeholder="Ops Manager"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="wh-contact-phone">Contact phone</Label>
        <Input
          id="wh-contact-phone"
          value={values.contactPhone}
          onChange={handleChange("contactPhone")}
          placeholder="+91 9876543210"
          disabled={isPending}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="wh-address1">Address line 1</Label>
        <Input
          id="wh-address1"
          value={values.addressLine1}
          onChange={handleChange("addressLine1")}
          placeholder="Street address, building"
          disabled={isPending}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="wh-address2">Address line 2 (optional)</Label>
        <Input
          id="wh-address2"
          value={values.addressLine2 ?? ""}
          onChange={handleChange("addressLine2")}
          placeholder="Apartment, area, landmark"
          disabled={isPending}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="wh-city">City</Label>
          <Input
            id="wh-city"
            value={values.city}
            onChange={handleChange("city")}
            placeholder="Mumbai"
            disabled={isPending}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="wh-state">State</Label>
          <Input
            id="wh-state"
            value={values.state}
            onChange={handleChange("state")}
            placeholder="Maharashtra"
            disabled={isPending}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="wh-pincode">Pincode</Label>
          <Input
            id="wh-pincode"
            value={values.pincode}
            onChange={handleChange("pincode")}
            placeholder="400001"
            maxLength={6}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : values.id ? "Save changes" : "Save location"}
        </Button>
      </div>
    </form>
  )
}

