export async function createOrderShipment(logisticsPayload: any) {
  const res = await fetch("/api/logistics/shipments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(logisticsPayload),
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(text || res.statusText)
  }
  return JSON.parse(text) as { ok: boolean; shipment?: { awb: string; trackingUrl?: string } }
}

export async function getShipmentLabelUrl(providerShipmentId: string, provider = "delhivery") {
  const url = `/api/logistics/shipments/${encodeURIComponent(
    providerShipmentId
  )}/label?provider=${encodeURIComponent(provider)}`
  return url
}

export type ServiceabilityStatus =
  | "idle"
  | "checking"
  | "serviceable"
  | "not_serviceable"
  | "temporarily_unavailable"
  | "error"

export interface ServiceabilityResultClient {
  status: ServiceabilityStatus
  message: string
  pincode?: string
}

export async function checkPincodeServiceability(
  pincode: string
): Promise<ServiceabilityResultClient> {
  const trimmed = pincode.trim()
  if (!/^\d{6}$/.test(trimmed)) {
    return {
      status: "error",
      message: "Enter a valid 6-digit pincode",
    }
  }

  const res = await fetch(`/api/logistics/serviceability?pincode=${encodeURIComponent(trimmed)}`)
  const text = await res.text()

  if (!res.ok) {
    try {
      const data = JSON.parse(text)
      const msg =
        data?.error || "Unable to check delivery right now. Please try again."
      return { status: "error", message: msg }
    } catch {
      return {
        status: "error",
        message: "Unable to check delivery right now. Please try again.",
      }
    }
  }

  try {
    const data = JSON.parse(text) as {
      ok: boolean
      result?: {
        success: boolean
        pincode: string
        serviceable: boolean
        isEmbargoed: boolean
        message: string
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.error("[serviceability:client:raw]", { status: res.status, body: data })
    }

    if (!data.ok || !data.result) {
      return {
        status: "temporarily_unavailable",
        message: "Delivery temporarily unavailable at this pincode",
      }
    }

    const r = data.result

    if (process.env.NODE_ENV === "development") {
      console.error("[serviceability:client:mapped]", {
        success: r.success,
        serviceable: r.serviceable,
        isEmbargoed: r.isEmbargoed,
        pincode: r.pincode,
      })
    }

    if (!r.success) {
      return {
        status: "temporarily_unavailable",
        message: "Delivery temporarily unavailable at this pincode",
      }
    }

    // Embargo is a distinct case (not "pin not in network")
    if (r.isEmbargoed) {
      return {
        status: "temporarily_unavailable",
        message: r.message || "Delivery temporarily unavailable at this pincode",
        pincode: r.pincode,
      }
    }

    if (!r.serviceable) {
      return {
        status: "not_serviceable",
        message: "Delivery not available at this pincode",
        pincode: r.pincode,
      }
    }

    return {
      status: "serviceable",
      message: r.message || "Delivery available to this pincode",
      pincode: r.pincode,
    }
  } catch (error) {
    console.error("[checkPincodeServiceability] Failed to parse response", error)
    return {
      status: "error",
      message: "Unable to check delivery right now. Please try again.",
    }
  }
}

export interface ShippingCostResultClient {
  success: boolean
  serviceable: boolean
  estimatedShippingCostPaise: number | null
  estimatedShippingCostInr: number | null
  currency: "INR"
  message: string
}

export async function calculateShippingCost(
  input: {
    merchantId: string
    destinationPincode: string
    paymentMethod?: "COD" | "UPI" | "RAZORPAY"
    weightGrams?: number
    codAmount?: number
  }
): Promise<ShippingCostResultClient> {
  try {
    if (!/^\d{6}$/.test(input.destinationPincode.trim())) {
      return {
        success: false,
        serviceable: false,
        estimatedShippingCostPaise: null,
        estimatedShippingCostInr: null,
        currency: "INR",
        message: "Enter a valid 6-digit pincode",
      }
    }

    const res = await fetch("/api/logistics/shipping-cost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchantId: input.merchantId,
        destinationPincode: input.destinationPincode.trim(),
        provider: "delhivery",
        paymentMethod: input.paymentMethod,
        weightGrams: input.weightGrams,
        codAmount: input.codAmount,
      }),
    })

    const text = await res.text()
    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }

    if (process.env.NODE_ENV === "development") {
      console.error("[serviceability:shipping-cost:client:raw]", {
        status: res.status,
        body: data ?? text,
      })
    }

    if (!res.ok) {
      const msg = data?.error || "Unable to calculate shipping right now. Please try again."
      return {
        success: false,
        serviceable: false,
        estimatedShippingCostPaise: null,
        estimatedShippingCostInr: null,
        currency: "INR",
        message: msg,
      }
    }

    const result = data?.result
    if (!data?.ok || !result) {
      return {
        success: false,
        serviceable: false,
        estimatedShippingCostPaise: null,
        estimatedShippingCostInr: null,
        currency: "INR",
        message: "Unable to calculate shipping right now. Please try again.",
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.error("[serviceability:shipping-cost:client:mapped]", { result })
    }

    return {
      success: Boolean(result.success),
      serviceable: Boolean(result.serviceable),
      estimatedShippingCostPaise:
        typeof result.estimatedShippingCostPaise === "number"
          ? result.estimatedShippingCostPaise
          : null,
      estimatedShippingCostInr:
        typeof result.estimatedShippingCostInr === "number"
          ? result.estimatedShippingCostInr
          : null,
      currency: (result.currency as "INR") ?? "INR",
      message: result.message || "Unable to calculate shipping right now. Please try again.",
    }
  } catch (error) {
    console.error("[calculateShippingCost]", error)
    return {
      success: false,
      serviceable: false,
      estimatedShippingCostPaise: null,
      estimatedShippingCostInr: null,
      currency: "INR",
      message: "Unable to calculate shipping right now. Please try again.",
    }
  }
}

