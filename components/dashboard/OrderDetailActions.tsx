"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

type OrderStage =
  | "NEW"
  | "CONFIRMED"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"

interface OrderDetailActionsProps {
  orderId: string
  currentStage: OrderStage
}

export function OrderDetailActions({
  orderId,
  currentStage,
}: OrderDetailActionsProps) {
  const { toast } = useToast()
  const [stage, setStage] = useState<OrderStage>(currentStage)
  const [isPending, startTransition] = useTransition()

  const canConfirm = stage === "NEW"
  const canPack = stage === "CONFIRMED"
  const canMarkDelivered = stage === "OUT_FOR_DELIVERY"
  const canCancel =
    !["CANCELLED", "DELIVERED", "RETURNED", "SHIPPED", "OUT_FOR_DELIVERY"].includes(
      stage
    )

  const callStageApi = (targetStage: OrderStage, reason?: string) => {
    startTransition(async () => {
      try {
        const body: any = { stage: targetStage }
        if (targetStage === "CANCELLED" && reason) {
          body.reason = reason
        }

        const res = await fetch(
          `/api/merchant/orders/${encodeURIComponent(orderId)}/stage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        )
        const text = await res.text()
        if (!res.ok) {
          throw new Error(
            `Failed to update stage (${res.status}): ${text || res.statusText}`
          )
        }
        const data = JSON.parse(text) as { order: { stage: OrderStage } }
        setStage(data.order.stage)
        toast({
          title: "Order updated",
          description: `Stage changed to ${data.order.stage}`,
        })
      } catch (error) {
        console.error("Order stage update error:", error)
        toast({
          title: "Failed to update order",
          description:
            error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive",
        })
      }
    })
  }

  const handleCancel = () => {
    const reason = window.prompt("Enter cancellation reason:")
    if (!reason || reason.trim().length === 0) {
      toast({
        title: "Cancellation aborted",
        description: "Reason is required to cancel an order.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/merchant/orders/${encodeURIComponent(orderId)}/cancel`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason }),
          }
        )
        const text = await res.text()
        if (!res.ok) {
          throw new Error(
            `Failed to cancel order (${res.status}): ${text || res.statusText}`
          )
        }
        const data = JSON.parse(text) as { order: { stage: OrderStage } }
        setStage(data.order.stage)
        toast({
          title: "Order cancelled",
          description: "Order has been cancelled.",
        })
      } catch (error) {
        console.error("Order cancel error:", error)
        toast({
          title: "Failed to cancel order",
          description:
            error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive",
        })
      }
    })
  }

  const handleShipment = () => {
    const courierName = window.prompt("Courier name:")
    if (!courierName || courierName.trim().length === 0) {
      toast({
        title: "Shipment aborted",
        description: "Courier name is required.",
        variant: "destructive",
      })
      return
    }
    const awb = window.prompt("AWB / Tracking number:")
    if (!awb || awb.trim().length === 0) {
      toast({
        title: "Shipment aborted",
        description: "AWB is required.",
        variant: "destructive",
      })
      return
    }
    const trackingUrl = window.prompt("Tracking URL (optional):") || undefined

    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/merchant/orders/${encodeURIComponent(orderId)}/shipment`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courierName, awb, trackingUrl }),
          }
        )
        const text = await res.text()
        if (!res.ok) {
          throw new Error(
            `Failed to update shipment (${res.status}): ${text || res.statusText}`
          )
        }
        const data = JSON.parse(text) as { order: { stage: OrderStage } }
        setStage(data.order.stage)
        toast({
          title: "Shipment updated",
          description: "Shipment details saved.",
        })
      } catch (error) {
        console.error("Shipment update error:", error)
        toast({
          title: "Failed to update shipment",
          description:
            error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive",
        })
      }
    })
  }

  const handleNote = () => {
    const message = window.prompt("Internal note:")
    if (!message || message.trim().length === 0) {
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/merchant/orders/${encodeURIComponent(orderId)}/note`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
          }
        )
        const text = await res.text()
        if (!res.ok) {
          throw new Error(
            `Failed to add note (${res.status}): ${text || res.statusText}`
          )
        }
        // We don't need to update local state; timeline is server-rendered on refresh.
        toast({
          title: "Note added",
          description: "Internal note has been added to the timeline.",
        })
      } catch (error) {
        console.error("Note add error:", error)
        toast({
          title: "Failed to add note",
          description:
            error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={!canConfirm || isPending}
        onClick={() => callStageApi("CONFIRMED")}
      >
        Confirm
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={!canPack || isPending}
        onClick={() => callStageApi("PACKED")}
      >
        Mark packed
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={handleShipment}
      >
        Add shipment
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={!canMarkDelivered || isPending}
        onClick={() => callStageApi("DELIVERED")}
      >
        Mark delivered
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={!canCancel || isPending}
        onClick={handleCancel}
      >
        Cancel order
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={isPending}
        onClick={handleNote}
      >
        Add note
      </Button>
    </div>
  )
}

