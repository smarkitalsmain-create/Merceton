import {
  LabelResult,
  ServiceabilityResult,
  ShipmentCreateInput,
  ShipmentCreateResult,
  TrackingEvent,
  TrackingResult,
  WarehouseInput,
  WarehouseResult,
} from "@/lib/logistics/types"
import {
  DelhiveryPincodeResponse,
  DelhiveryShipmentCreateResponse,
  DelhiveryTrackingResponse,
  DelhiveryWarehouseRequest,
  DelhiveryWarehouseResponse,
} from "./types"

// NOTE: Status mapping is a scaffold; align with Delhivery's actual status codes.
export function mapDelhiveryStatusToInternal(status: string): ShipmentCreateResult["status"] {
  const normalized = status.toLowerCase()
  if (normalized.includes("out for delivery")) return "out_for_delivery"
  if (normalized.includes("in transit")) return "in_transit"
  if (normalized.includes("delivered")) return "delivered"
  if (normalized.includes("pickup")) return "pickup_scheduled"
  if (normalized.includes("cancel")) return "cancelled"
  if (normalized.includes("return")) return "returned"
  if (normalized.includes("failed")) return "failed_delivery"
  return "shipment_created"
}

export function mapPincodeResponse(
  res: DelhiveryPincodeResponse
): ServiceabilityResult {
  const deliveryCodes = (res?.delivery_codes as any[]) || []
  console.error("[DelhiveryClient] Pincode response debug", {
    hasDeliveryCodes: Array.isArray(deliveryCodes),
    deliveryCodesCount: deliveryCodes.length,
  })

  const first = deliveryCodes[0] || {}
  const pin: string =
    first.postal_code ??
    first.pin_code ??
    first.pincode ??
    first.pin ??
    ""

  const codFlag: string | undefined = first.cod ?? first.cod_fulfillment
  const pickupFlag: string | undefined = first.pickup
  const prePaidFlag: string | undefined = first.pre_paid

  const isServiceable =
    !!first &&
    (codFlag === "Y" || prePaidFlag === "Y" || pickupFlag === "Y")

  const isEmbargoed =
    first.is_embargoed === "Y" ||
    first.embargo === "Y" ||
    false

  const message = isServiceable
    ? "Delivery is available to this pincode."
    : "Delivery is currently not available to this pincode."

  return {
    success: true,
    pincode: pin,
    serviceable: isServiceable,
    isEmbargoed,
    message,
    cod: codFlag === "Y",
    // Delhivery response does not include ETA in this endpoint; keep undefined.
    estimatedDeliveryDays: undefined,
    raw: res,
  }
}

export function mapWarehouseInputToDelhivery(
  input: WarehouseInput
): DelhiveryWarehouseRequest {
  // TODO: map to actual Delhivery warehouse payload structure
  const payload: DelhiveryWarehouseRequest = {
    name: input.name,
    contact_name: input.contactName,
    phone: input.contactPhone,
    address: {
      line1: input.addressLine1,
      line2: input.addressLine2,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
    },
    external_id: input.externalId,
  }

  return payload
}

export function mapDelhiveryWarehouseToResult(
  input: WarehouseInput,
  res: DelhiveryWarehouseResponse
): WarehouseResult {
  // TODO: pick actual id field from Delhivery response
  const providerWarehouseId = (res as any).id ?? (res as any).warehouse_id ?? ""
  return {
    ...input,
    providerWarehouseId,
    raw: res,
  }
}

export function mapShipmentCreateInputToDelhivery(
  input: ShipmentCreateInput
): DelhiveryShipmentCreateResponse {
  // TODO: align with Delhivery shipment creation structure
  const payload: DelhiveryShipmentCreateResponse = {
    order_id: input.orderId,
    warehouse_id: input.providerWarehouseId,
    to: {
      name: input.toName,
      phone: input.toPhone,
      address: {
        line1: input.toAddressLine1,
        line2: input.toAddressLine2,
        city: input.toCity,
        state: input.toState,
        pincode: input.toPincode,
      },
    },
    cod_amount: input.codAmount,
    parcel: {
      weight_grams: input.totalWeightGrams,
      dimensions_cm: {
        length: input.lengthCm,
        width: input.widthCm,
        height: input.heightCm,
      },
    },
  }

  return payload
}

export function mapDelhiveryShipmentToResult(
  res: DelhiveryShipmentCreateResponse
): ShipmentCreateResult {
  const awb = (res as any).awb ?? (res as any).waybill ?? ""
  const statusText = (res as any).status ?? "Shipment Created"
  const trackingUrl =
    (res as any).tracking_url ??
    (awb ? `https://track.delhivery.com/waybill/${encodeURIComponent(awb)}` : undefined)

  return {
    providerShipmentId: (res as any).id ?? (res as any).shipment_id ?? awb,
    awb,
    trackingUrl,
    status: mapDelhiveryStatusToInternal(statusText),
    raw: res,
  }
}

export function mapDelhiveryLabelToResult(awb: string, data: Buffer): LabelResult {
  return {
    awb,
    contentType: "application/pdf",
    data,
  }
}

export function mapDelhiveryTrackingToResult(
  awb: string,
  res: DelhiveryTrackingResponse
): TrackingResult {
  // TODO: align with real Delhivery tracking payload. The following assumes a list of events.
  const eventsRaw: any[] =
    ((res as any).events as any[]) ??
    ((res as any).tracking_details as any[]) ??
    ((res as any).scans as any[]) ??
    []

  const events: TrackingEvent[] = eventsRaw.map((e) => {
    const status: string = e.status ?? e.scan ?? "Unknown"
    const occurredAtRaw: string | Date =
      e.occurred_at ?? e.time ?? e.timestamp ?? new Date().toISOString()
    const occurredAt =
      occurredAtRaw instanceof Date ? occurredAtRaw : new Date(occurredAtRaw)

    return {
      status,
      statusCode: e.code ?? e.status_code,
      normalizedStatus: mapDelhiveryStatusToInternal(status),
      description: e.remark ?? e.description,
      location: e.location,
      occurredAt,
      raw: e,
    }
  })

  const currentStatus = events[events.length - 1] ?? {
    status: "Unknown",
    normalizedStatus: "shipment_created" as const,
    occurredAt: new Date(),
  }

  return {
    awb,
    currentStatus,
    events,
    raw: res,
  }
}

