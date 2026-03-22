import { validatePincode, validateShipmentCreateInput, validateWarehouseInput } from "@/lib/logistics/validators"
import type { ServiceabilityInput, ShipmentCreateInput, WarehouseInput } from "@/lib/logistics/types"

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

