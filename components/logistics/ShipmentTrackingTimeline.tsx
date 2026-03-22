"use client"

import { useEffect, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { ShippingStatusBadge } from "@/components/logistics/ShippingStatusBadge"
import { useToast } from "@/hooks/use-toast"

interface TrackingEvent {
  status: string
  statusCode?: string | null
  normalizedStatus: string
  description?: string | null
  location?: string | null
  occurredAt: string
}

interface TrackingData {
  awb: string
  currentStatus: TrackingEvent
  events: TrackingEvent[]
}

interface ShipmentTrackingTimelineProps {
  awb: string
  provider?: string
}

export function ShipmentTrackingTimeline({ awb, provider = "delhivery" }: ShipmentTrackingTimelineProps) {
  const { toast } = useToast()
  const [tracking, setTracking] = useState<TrackingData | null>(null)
  const [isPending, startTransition] = useTransition()
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  const fetchTracking = () => {
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/logistics/shipments/${encodeURIComponent(awb)}/tracking?provider=${encodeURIComponent(provider)}`
        )
        const text = await res.text()
        if (!res.ok) {
          throw new Error(text || res.statusText)
        }
        const data = JSON.parse(text) as { ok: boolean; tracking?: TrackingData }
        if (!data.ok || !data.tracking) {
          throw new Error("Tracking data is not available yet.")
        }
        setTracking(data.tracking)
        setHasLoadedOnce(true)
      } catch (error) {
        console.error("[ShipmentTrackingTimeline] Failed to fetch tracking:", error)
        toast({
          title: "Unable to refresh tracking",
          description:
            error instanceof Error ? error.message : "Please try again in a few minutes.",
          variant: "destructive",
        })
      }
    })
  }

  useEffect(() => {
    fetchTracking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awb, provider])

  if (!hasLoadedOnce && isPending) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-20 w-full animate-pulse rounded bg-muted" />
      </div>
    )
  }

  if (!tracking) {
    return (
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>No tracking events yet for this shipment.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={fetchTracking}
          disabled={isPending}
        >
          {isPending ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
    )
  }

  const events = [...tracking.events].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <div className="space-y-1">
          <p className="font-medium">Shipment status</p>
          <div className="flex items-center gap-2">
            <ShippingStatusBadge status={tracking.currentStatus.normalizedStatus} />
            <span className="text-xs text-muted-foreground">
              Last update{" "}
              {new Date(tracking.currentStatus.occurredAt).toLocaleString()}
            </span>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={fetchTracking}
          disabled={isPending}
        >
          {isPending ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events reported yet.</p>
        ) : (
          <ol className="relative border-l border-border text-sm">
            {events.map((event, idx) => (
              <li key={`${event.occurredAt}-${idx}`} className="ml-4 mb-4">
                <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary" />
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">
                    {event.description || event.status || "Status update"}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.occurredAt).toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <ShippingStatusBadge status={event.normalizedStatus} />
                  {event.location && <span>• {event.location}</span>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}

