import {
  LabelResult,
  ServiceabilityResult,
  ShipmentCreateInput,
  ShipmentCreateResult,
  TrackingEvent,
  TrackingResult,
  WarehouseInput,
  WarehouseResult,
  ShippingCostResult,
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

function digits6(s: string | undefined): string {
  if (!s) return ""
  const d = String(s).replace(/\D/g, "").slice(-6)
  return d.length === 6 ? d : ""
}

/**
 * Delhivery pin-codes API: presence of at least one `delivery_codes` row means the pin is on the network.
 * Older logic incorrectly required cod/pre_paid/pickup === "Y"; those can be "N" or absent while delivery still exists.
 */
export function mapPincodeResponse(
  res: DelhiveryPincodeResponse,
  requestedPincode: string
): ServiceabilityResult {
  const deliveryCodes = Array.isArray(res?.delivery_codes) ? (res.delivery_codes as any[]) : []
  const first = deliveryCodes[0] ?? {}

  const pinFromRow =
    digits6(first.postal_code) ||
    digits6(first.pin_code) ||
    digits6(first.pincode) ||
    digits6(first.pin) ||
    ""

  const pincode = pinFromRow || digits6(requestedPincode) || requestedPincode.trim()

  const hasDelivery = deliveryCodes.length > 0

  const remark = String(first.remark ?? first.remarks ?? (res as any)?.remark ?? "").trim()
  const remarkLower = remark.toLowerCase()

  // Explicit embargo flags from API
  const embargoFlag =
    first.is_embargoed === "Y" ||
    first.embargo === "Y" ||
    first.restricted === "Y"

  // Non-empty remark: only treat as embargo when it clearly says so (blank = not embargo)
  const embargoByRemark =
    remark.length > 0 &&
    /embargo|temporarily\s+not\s+serviceable|restricted\s+delivery|delivery\s+blocked|not\s+serviceable\s+due\s+to/i.test(
      remarkLower
    )

  const isEmbargoed = embargoFlag || embargoByRemark

  const isServiceable = hasDelivery && !isEmbargoed

  const codFlag = first.cod ?? first.cod_fulfillment
  const prePaidFlag = first.pre_paid
  const pickupFlag = first.pickup
  const codAvailable = codFlag === "Y" || codFlag === true || codFlag === "y"

  let message: string
  if (isEmbargoed) {
    message = remark || "Delivery temporarily unavailable at this pincode"
  } else if (isServiceable) {
    message = "Delivery is available to this pincode."
  } else {
    message = "Delivery is currently not available to this pincode."
  }

  if (process.env.NODE_ENV === "development") {
    console.error("[serviceability:normalize]", {
      requestedPincode,
      deliveryCodesCount: deliveryCodes.length,
      hasDelivery,
      embargoFlag,
      embargoByRemark,
      isEmbargoed,
      isServiceable,
      pincode,
      remarkPreview: remark ? remark.slice(0, 120) : "",
      cod: codFlag,
      pre_paid: prePaidFlag,
      pickup: pickupFlag,
    })
  }

  return {
    success: true,
    pincode,
    serviceable: isServiceable,
    isEmbargoed,
    message,
    cod: codAvailable,
    estimatedDeliveryDays: undefined,
    raw: res,
  }
}

function toNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string") {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

/**
 * Delhivery shipping charge estimation (invoice charges API) is loosely shaped.
 * We look for `total_amount`-like fields and convert to INR + paise.
 */
export function mapDelhiveryShippingCostToResult(params: {
  raw: unknown
  serviceable: boolean
  message: string
}): ShippingCostResult {
  const raw = params.raw as any

  const totalAmountRaw =
    raw?.total_amount ??
    raw?.totalAmount ??
    raw?.invoice?.total_amount ??
    raw?.invoice?.totalAmount ??
    raw?.data?.total_amount ??
    raw?.data?.totalAmount

  const totalAmount = toNumberOrNull(totalAmountRaw)

  if (totalAmount === null) {
    return {
      success: false,
      serviceable: params.serviceable,
      estimatedShippingCostPaise: null,
      estimatedShippingCostInr: null,
      currency: "INR",
      message: params.message || "Unable to calculate shipping right now. Please try again.",
      raw,
    }
  }

  // Delhivery typically returns amounts in INR (as a float). We convert to paise for internal usage.
  const estimatedShippingCostInr = totalAmount
  const estimatedShippingCostPaise = Math.round(estimatedShippingCostInr * 100)

  return {
    success: true,
    serviceable: params.serviceable,
    estimatedShippingCostPaise,
    estimatedShippingCostInr,
    currency: "INR",
    message: params.message || "Estimated shipping cost calculated.",
    raw,
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

