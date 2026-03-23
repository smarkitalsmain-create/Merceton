import type {
  ServiceabilityInput,
  ServiceabilityResult,
  WarehouseInput,
  WarehouseResult,
  ShipmentCreateInput,
  ShipmentCreateResult,
  LabelResult,
  TrackingResult,
  ShippingCostInput,
  ShippingCostResult,
  LogisticsProviderKey,
} from "../types"

export interface ShippingProviderContext {
  providerKey: LogisticsProviderKey
}

export interface ShippingProvider {
  readonly key: LogisticsProviderKey

  checkServiceability(input: ServiceabilityInput): Promise<ServiceabilityResult>

  calculateShippingCost(input: ShippingCostInput): Promise<ShippingCostResult>

  createWarehouse(input: WarehouseInput): Promise<WarehouseResult>

  updateWarehouse(
    providerWarehouseId: string,
    input: WarehouseInput
  ): Promise<WarehouseResult>

  createShipment(input: ShipmentCreateInput): Promise<ShipmentCreateResult>

  generateLabel(providerShipmentId: string): Promise<LabelResult>

  trackShipment(awb: string): Promise<TrackingResult>
}

