import type {
  LabelResult,
  ServiceabilityInput,
  ServiceabilityResult,
  ShipmentCreateInput,
  ShipmentCreateResult,
  TrackingResult,
  WarehouseInput,
  WarehouseResult,
} from "@/lib/logistics/types"
import type { ShippingProvider } from "@/lib/logistics/providers/base"
import { DelhiveryClient } from "./client"
import {
  mapDelhiveryLabelToResult,
  mapDelhiveryShipmentToResult,
  mapDelhiveryTrackingToResult,
  mapDelhiveryWarehouseToResult,
  mapPincodeResponse,
  mapShipmentCreateInputToDelhivery,
  mapWarehouseInputToDelhivery,
} from "./mappers"
import {
  validateDelhiveryServiceabilityInput,
  validateDelhiveryShipmentInput,
  validateDelhiveryWarehouseInput,
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
    return mapPincodeResponse(res)
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
}

