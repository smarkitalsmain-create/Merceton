import type {
  LabelResult,
  LogisticsProviderKey,
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
import { getShippingProvider } from "@/lib/logistics/registry"
import {
  validateServiceabilityInput,
  validateShipmentCreateInput,
  validateWarehouseInput,
  validateShippingCostInput,
} from "@/lib/logistics/validators"

export async function getServiceability(
  providerKey: LogisticsProviderKey,
  input: ServiceabilityInput
): Promise<ServiceabilityResult> {
  const provider = getShippingProvider(providerKey)
  const validated = validateServiceabilityInput(input)
  return provider.checkServiceability(validated)
}

export async function createMerchantWarehouse(
  providerKey: LogisticsProviderKey,
  input: WarehouseInput
): Promise<WarehouseResult> {
  const provider = getShippingProvider(providerKey)
  const validated = validateWarehouseInput(input)
  return provider.createWarehouse(validated)
}

export async function updateMerchantWarehouse(
  providerKey: LogisticsProviderKey,
  providerWarehouseId: string,
  input: WarehouseInput
): Promise<WarehouseResult> {
  const provider = getShippingProvider(providerKey)
  const validated = validateWarehouseInput(input)
  return provider.updateWarehouse(providerWarehouseId, validated)
}

export async function createOrderShipment(
  providerKey: LogisticsProviderKey,
  input: ShipmentCreateInput
): Promise<ShipmentCreateResult> {
  const provider = getShippingProvider(providerKey)
  const validated = validateShipmentCreateInput(input)
  return provider.createShipment(validated)
}

export async function getShipmentLabel(
  providerKey: LogisticsProviderKey,
  providerShipmentId: string
): Promise<LabelResult> {
  const provider = getShippingProvider(providerKey)
  return provider.generateLabel(providerShipmentId)
}

export async function getShipmentTracking(
  providerKey: LogisticsProviderKey,
  awb: string
): Promise<TrackingResult> {
  const provider = getShippingProvider(providerKey)
  return provider.trackShipment(awb)
}

export async function calculateShippingCost(
  providerKey: LogisticsProviderKey,
  input: ShippingCostInput
): Promise<ShippingCostResult> {
  const provider = getShippingProvider(providerKey)
  const validated = validateShippingCostInput(input)
  return provider.calculateShippingCost(validated)
}

