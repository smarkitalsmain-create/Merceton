import { ProviderAuthError, ProviderBadResponseError, ProviderUnavailableError } from "@/lib/logistics/errors"

const DEFAULT_TIMEOUT_MS = 10_000

interface DelhiveryClientOptions {
  baseUrl?: string
  token?: string
  timeoutMs?: number
}

export class DelhiveryClient {
  private readonly baseUrl: string
  private readonly token: string
  private readonly timeoutMs: number

  constructor(opts: DelhiveryClientOptions = {}) {
    const baseUrl = opts.baseUrl ?? process.env.DELHIVERY_BASE_URL
    const token = opts.token ?? process.env.DELHIVERY_API_TOKEN

    // Debug-time logging for env presence (never log token value)
    console.error("[DelhiveryClient] Env check", {
      hasBaseUrl: !!baseUrl,
      hasToken: !!token,
    })

    if (!baseUrl || !token) {
      console.error("[DelhiveryClient] Missing credentials", {
        hasBaseUrl: !!baseUrl,
        hasToken: !!token,
      })
      throw new ProviderAuthError("Delhivery credentials are not configured")
    }

    this.baseUrl = baseUrl.replace(/\/+$/, "")
    this.token = token
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), this.timeoutMs)

    const url = `${this.baseUrl}${path}`

    try {
      console.error("[DelhiveryClient] Request start", {
        url,
        method: init.method ?? "GET",
      })

      const res = await fetch(url, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${this.token}`,
          ...(init.headers || {}),
        },
        cache: "no-store",
        signal: controller.signal,
      })

      console.error("[DelhiveryClient] Response received", {
        url,
        status: res.status,
        statusText: res.statusText,
      })

      if (res.status === 401 || res.status === 403) {
        throw new ProviderAuthError()
      }

      if (res.status === 429) {
        throw new ProviderUnavailableError("Delhivery rate limit or capacity issue")
      }

      if (!res.ok) {
        // Log only safe metadata, never token or full body
        console.error("[DelhiveryClient] Non-OK response", {
          url,
          status: res.status,
          statusText: res.statusText,
        })
        throw new ProviderBadResponseError(
          `Delhivery responded with status ${res.status} ${res.statusText}`
        )
      }

      const text = await res.text()
      if (!text) {
        return {} as T
      }

      try {
        return JSON.parse(text) as T
      } catch (err) {
        console.error("[DelhiveryClient] Failed to parse JSON", {
          url,
          status: res.status,
          rawText: text,
        })
        throw new ProviderBadResponseError("Invalid JSON from Delhivery", err)
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        console.error("[DelhiveryClient] Request timeout", { url })
        throw new ProviderUnavailableError("Delhivery did not respond in time")
      }
      console.error("[DelhiveryClient] Request failed", {
        url,
        errorMessage: err?.message,
        stack: err?.stack,
      })
      throw err
    } finally {
      clearTimeout(id)
    }
  }

  // NOTE: Exact endpoints, query params and payloads should be aligned with
  // official Delhivery docs. The following methods are scaffolds with
  // reasonable placeholders and TODOs.

  async checkPincode(pincode: string): Promise<any> {
    // Live Delhivery pincode serviceability endpoint:
    // GET /c/api/pin-codes/json/?filter_codes={PINCODE}
    const path = `/c/api/pin-codes/json/?filter_codes=${encodeURIComponent(pincode)}`
    console.error("[DelhiveryClient] checkPincode url", { url: `${this.baseUrl}${path}` })
    return this.request<any>(path)
  }

  async createWarehouse(payload: any): Promise<any> {
    // TODO: align with Delhivery warehouse create API
    return this.request<any>("/api/warehouses", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  async updateWarehouse(id: string, payload: any): Promise<any> {
    // TODO: align with Delhivery warehouse update API
    return this.request<any>(`/api/warehouses/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  }

  async createShipment(payload: any): Promise<any> {
    // TODO: align with Delhivery shipment creation API
    return this.request<any>("/api/shipments", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  async getLabel(shipmentId: string): Promise<Buffer> {
    // TODO: align with Delhivery label API; may need different path or query
    const path = `/api/shipments/${encodeURIComponent(shipmentId)}/label`
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: "GET",
        headers: {
          Authorization: `Token ${this.token}`,
        },
        cache: "no-store",
        signal: controller.signal,
      })

      if (!res.ok) {
        console.error("[DelhiveryClient] Non-OK response for label", {
          status: res.status,
          statusText: res.statusText,
          url: path,
        })
        throw new ProviderBadResponseError(
          `Delhivery responded with status ${res.status} ${res.statusText} for label`
        )
      }

      const arrayBuffer = await res.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (err: any) {
      if (err?.name === "AbortError") {
        console.error("[DelhiveryClient] Label request timeout", { url: path })
        throw new ProviderUnavailableError("Delhivery did not respond in time for label")
      }
      throw err
    } finally {
      clearTimeout(id)
    }
  }

  async track(awb: string): Promise<any> {
    // TODO: align with Delhivery tracking API
    return this.request<any>(`/api/track/${encodeURIComponent(awb)}`)
  }

  async calculateShippingCost(params: {
    // md: billing mode as per Delhivery invoice/charges API (E=Express, S=Surface)
    md: "E" | "S"
    // Chargeable weight in grams
    cgm: number
    o_pin: string
    d_pin: string
    // Shipment status for invoice calculation
    ss: "Delivered" | "RTO" | "DTO"
  }): Promise<any> {
    const query = new URLSearchParams({
      md: params.md,
      cgm: String(Math.max(0, Math.floor(params.cgm))),
      o_pin: params.o_pin,
      d_pin: params.d_pin,
      ss: params.ss,
    })

    // Delhivery invoice charges endpoint used for shipping charge estimation.
    // Docs: https://delhivery-express-api-doc.readme.io/reference/testinput-7
    return this.request<any>(`/api/kinko/v1/invoice/charges/.json?${query.toString()}`)
  }
}

