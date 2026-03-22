"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createOrderShipment, getShipmentLabelUrl } from "@/lib/frontend/logistics"
import { ShipmentTrackingTimeline } from "@/components/logistics/ShipmentTrackingTimeline"

interface ShipmentCardProps {
  orderId: string
  merchantId: string
  providerWarehouseId?: string
  existingShipments: {
    id: string
    courierName: string
    awb: string
    trackingUrl?: string | null
  }[]
}

export function ShipmentCard({
  orderId,
  merchantId,
  providerWarehouseId,
  existingShipments,
}: ShipmentCardProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [toName, setToName] = useState("")
  const [toPhone, setToPhone] = useState("")
  const [toAddressLine1, setToAddressLine1] = useState("")
  const [toCity, setToCity] = useState("")
  const [toState, setToState] = useState("")
  const [toPincode, setToPincode] = useState("")
  const [codAmount, setCodAmount] = useState<string>("")

  const hasShipment = existingShipments.length > 0
  const primaryShipment = existingShipments[0]

  const handleCreateShipment = () => {
    if (!providerWarehouseId) {
      toast({
        title: "Warehouse required",
        description:
          "Set up a pickup location in Logistics settings before creating shipments.",
        variant: "destructive",
      })
      return
    }

    if (!toName || !toPhone || !toAddressLine1 || !toCity || !toState || !toPincode) {
      toast({
        title: "Missing details",
        description: "Please fill recipient name, phone, address, city, state and pincode.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        const payload = {
          provider: "delhivery",
          orderId,
          merchantId,
          providerWarehouseId,
          toName,
          toPhone,
          toAddressLine1,
          toCity,
          toState,
          toPincode,
          codAmount: codAmount ? Number(codAmount) : undefined,
        }

        const data = await createOrderShipment(payload)
        if (!data.ok || !data.shipment) {
          throw new Error("Shipment not created. Please try again.")
        }

        toast({
          title: "Shipment created",
          description: `AWB ${data.shipment.awb} has been generated.`,
        })
        // For now rely on full page refresh; we don't mutate parent state here.
      } catch (error) {
        console.error("[ShipmentCard] Failed to create shipment:", error)
        toast({
          title: "Failed to create shipment",
          description:
            error instanceof Error ? error.message : "Please try again or contact support.",
          variant: "destructive",
        })
      }
    })
  }

  const handleOpenLabel = async () => {
    if (!primaryShipment) return
    const url = await getShipmentLabelUrl(primaryShipment.awb, "delhivery")
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="space-y-4 text-sm">
      {hasShipment ? (
        <>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping provider</span>
              <span>{primaryShipment.courierName || "Delhivery"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tracking number</span>
              <span>{primaryShipment.awb}</span>
            </div>
            {primaryShipment.trackingUrl && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tracking link</span>
                <a
                  href={primaryShipment.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary underline"
                >
                  View on carrier
                </a>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={handleOpenLabel}
            >
              {isPending ? "Opening label..." : "View label"}
            </Button>
          </div>
          <ShipmentTrackingTimeline awb={primaryShipment.awb} provider="delhivery" />
        </>
      ) : (
        <>
          <p className="text-muted-foreground">
            No shipment created yet. Fill in the recipient details to generate a shipment.
          </p>
          <div className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="ship-to-name">Recipient name</Label>
                <Input
                  id="ship-to-name"
                  value={toName}
                  onChange={(e) => setToName(e.target.value)}
                  placeholder="Customer name"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ship-to-phone">Phone</Label>
                <Input
                  id="ship-to-phone"
                  value={toPhone}
                  onChange={(e) => setToPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  disabled={isPending}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ship-to-address">Address line 1</Label>
              <Input
                id="ship-to-address"
                value={toAddressLine1}
                onChange={(e) => setToAddressLine1(e.target.value)}
                placeholder="Street address, apartment"
                disabled={isPending}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="ship-to-city">City</Label>
                <Input
                  id="ship-to-city"
                  value={toCity}
                  onChange={(e) => setToCity(e.target.value)}
                  placeholder="City"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ship-to-state">State</Label>
                <Input
                  id="ship-to-state"
                  value={toState}
                  onChange={(e) => setToState(e.target.value)}
                  placeholder="State"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ship-to-pincode">Pincode</Label>
                <Input
                  id="ship-to-pincode"
                  value={toPincode}
                  onChange={(e) =>
                    setToPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="400001"
                  maxLength={6}
                  disabled={isPending}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ship-cod">COD amount (optional)</Label>
              <Input
                id="ship-cod"
                value={codAmount}
                onChange={(e) =>
                  setCodAmount(e.target.value.replace(/[^\d.]/g, ""))
                }
                placeholder="0"
                disabled={isPending}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={handleCreateShipment}
            >
              {isPending ? "Creating shipment..." : "Create shipment"}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

