import { Badge } from "@/components/ui/badge"

export type ShipmentStatusInternal =
  | "pending"
  | "serviceable"
  | "packed"
  | "shipment_created"
  | "label_generated"
  | "pickup_scheduled"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed_delivery"
  | "returned"
  | "cancelled"

interface ShippingStatusBadgeProps {
  status: ShipmentStatusInternal | string
}

export function ShippingStatusBadge({ status }: ShippingStatusBadgeProps) {
  const normalized = String(status).toLowerCase()

  let variant: "default" | "outline" | "secondary" | "destructive" = "outline"
  let label = status

  if (normalized === "delivered") {
    variant = "default"
    label = "Delivered"
  } else if (normalized === "out_for_delivery") {
    variant = "default"
    label = "Out for delivery"
  } else if (normalized === "in_transit") {
    variant = "secondary"
    label = "In transit"
  } else if (normalized === "pickup_scheduled") {
    variant = "secondary"
    label = "Pickup scheduled"
  } else if (normalized === "shipment_created") {
    variant = "secondary"
    label = "Shipment created"
  } else if (normalized === "packed") {
    variant = "secondary"
    label = "Packed"
  } else if (normalized === "serviceable") {
    variant = "secondary"
    label = "Serviceable"
  } else if (normalized === "cancelled") {
    variant = "destructive"
    label = "Cancelled"
  } else if (normalized === "returned") {
    variant = "destructive"
    label = "Returned"
  } else if (normalized === "failed_delivery") {
    variant = "destructive"
    label = "Delivery failed"
  }

  return <Badge variant={variant}>{label}</Badge>
}

