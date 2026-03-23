import type {
  LabelResult,
  ServiceabilityInput,
  ServiceabilityResult,
  ShipmentCreateInput,
  ShipmentCreateResult,
  TrackingResult,
  WarehouseInput,
  WarehouseResult,
  ShippingCostInput,
  ShippingCostResult,
} from "@/lib/logistics/types"
import type { ShippingProvider } from "@/lib/logistics/providers/base"
import { DelhiveryClient } from "./client"
import {
  mapDelhiveryLabelToResult,
  mapDelhiveryShipmentToResult,
  mapDelhiveryTrackingToResult,
  mapDelhiveryWarehouseToResult,
  mapPincodeResponse,
  mapDelhiveryShippingCostToResult,
  mapShipmentCreateInputToDelhivery,
  mapWarehouseInputToDelhivery,
} from "./mappers"
import {
  validateDelhiveryServiceabilityInput,
  validateDelhiveryShipmentInput,
  validateDelhiveryWarehouseInput,
  validateDelhiveryShippingCostInput,
} from "./validators"

export class DelhiveryProvider implements ShippingProvider {
  readonly key = "delhivery" as const

  private readonly client: DelhiveryClient

  constructor(client?: DelhiveryClient) {
    this.client = client ?? new DelhiveryClient()
  }

  async checkServiceability(input: ServiceabilityInput): Promise<ServiceabilityResult> {
    const validated = validateDelhiveryServiceabilityInput(input)
    const res = await this.client.checkPincode(validated.pincode)
    return mapPincodeResponse(res, validated.pincode)
  }

  async createWarehouse(input: WarehouseInput): Promise<WarehouseResult> {
    const validated = validateDelhiveryWarehouseInput(input)
    const payload = mapWarehouseInputToDelhivery(validated)
    const res = await this.client.createWarehouse(payload)
    return mapDelhiveryWarehouseToResult(validated, res)
  }

  async updateWarehouse(
    providerWarehouseId: string,
    input: WarehouseInput
  ): Promise<WarehouseResult> {
    const validated = validateDelhiveryWarehouseInput(input)
    const payload = mapWarehouseInputToDelhivery(validated)
    const res = await this.client.updateWarehouse(providerWarehouseId, payload)
    return mapDelhiveryWarehouseToResult(validated, res)
  }

  async createShipment(input: ShipmentCreateInput): Promise<ShipmentCreateResult> {
    const validated = validateDelhiveryShipmentInput(input)
    const payload = mapShipmentCreateInputToDelhivery(validated)
    const res = await this.client.createShipment(payload)
    return mapDelhiveryShipmentToResult(res)
  }

  async generateLabel(providerShipmentId: string): Promise<LabelResult> {
    const data = await this.client.getLabel(providerShipmentId)
    // For now we assume shipmentId === AWB; we may adjust if Delhivery differentiates.
    return mapDelhiveryLabelToResult(providerShipmentId, data)
  }

  async trackShipment(awb: string): Promise<TrackingResult> {
    const res = await this.client.track(awb)
    return mapDelhiveryTrackingToResult(awb, res)
  }

  async calculateShippingCost(input: ShippingCostInput): Promise<ShippingCostResult> {
    // Validate at the provider level so we keep the route thin and consistent.
    const validated = validateDelhiveryShippingCostInput(input)

    // Ensure destination pin is on the Delhivery network (and not embargoed).
    // This avoids returning rates for invalid destination pins.
    let svc: ServiceabilityResult
    try {
      svc = await this.checkServiceability({ pincode: validated.destinationPincode })
    } catch {
      return {
        success: false,
        serviceable: false,
        estimatedShippingCostPaise: null,
        estimatedShippingCostInr: null,
        currency: "INR",
        message: "Unable to check delivery right now. Please try again.",
      }
    }

    if (!svc.success || !svc.serviceable || svc.isEmbargoed) {
      return {
        success: true,
        serviceable: false,
        estimatedShippingCostPaise: null,
        estimatedShippingCostInr: null,
        currency: "INR",
        message: svc.message || "Delivery not available at this pincode",
        raw: svc.raw,
      }
    }

    // Checkout currently doesn't collect dimensions/weight, so we use a safe default.
    // TODO: wire real package weight/dimensions from product/order lines to improve accuracy.
    const cgm = Math.max(1, Math.floor(validated.weightGrams ?? 1000))

    // md here is Delhivery billing mode (E=Express, S=Surface), not payment mode.
    // For MVP checkout we default to Surface to keep estimates conservative.
    const md: "E" | "S" = "S"
    const ss: "Delivered" = "Delivered"

    try {
      const res = await this.client.calculateShippingCost({
        md,
        cgm,
        o_pin: validated.originPincode,
        d_pin: validated.destinationPincode,
        ss,
      })

      return mapDelhiveryShippingCostToResult({
        raw: res,
        serviceable: true,
        message: "Estimated shipping cost calculated.",
      })
    } catch {
      return {
        success: false,
        serviceable: true,
        estimatedShippingCostPaise: null,
        estimatedShippingCostInr: null,
        currency: "INR",
        message: "Unable to calculate shipping right now. Please try again.",
      }
    }
  }
}

