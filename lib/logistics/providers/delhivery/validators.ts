import {
  validatePincode,
  validateShipmentCreateInput,
  validateWarehouseInput,
  validateShippingCostInput,
} from "@/lib/logistics/validators"
import type { ServiceabilityInput, ShipmentCreateInput, WarehouseInput, ShippingCostInput } from "@/lib/logistics/types"

export function validateDelhiveryServiceabilityInput(
  input: ServiceabilityInput
): ServiceabilityInput {
  return {
    ...input,
    pincode: validatePincode(input.pincode),
  }
}

export function validateDelhiveryWarehouseInput(input: WarehouseInput): WarehouseInput {
  return validateWarehouseInput(input)
}

export function validateDelhiveryShipmentInput(
  input: ShipmentCreateInput
): ShipmentCreateInput {
  return validateShipmentCreateInput(input)
}

export function validateDelhiveryShippingCostInput(
  input: ShippingCostInput
): ShippingCostInput {
  // Ensure pincode formats are correct (route might pass already-validated values, but
  // provider-level validation keeps invariants strong).
  const parsed = validateShippingCostInput(input)
  return {
    ...parsed,
    originPincode: validatePincode(parsed.originPincode),
    destinationPincode: validatePincode(parsed.destinationPincode),
  }
}

