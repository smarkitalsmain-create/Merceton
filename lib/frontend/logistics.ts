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

    if (!data.ok || !data.result) {
      return {
        status: "temporarily_unavailable",
        message: "Delivery temporarily unavailable at this pincode",
      }
    }

    const r = data.result

    if (!r.success) {
      return {
        status: "temporarily_unavailable",
        message: "Delivery temporarily unavailable at this pincode",
      }
    }

    if (!r.serviceable || r.isEmbargoed) {
      return {
        status: "not_serviceable",
        message: "Delivery not available at this pincode",
        pincode: r.pincode,
      }
    }

    return {
      status: "serviceable",
      message: "Delivery available to this pincode",
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

