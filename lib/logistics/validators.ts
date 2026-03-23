import { z } from "zod"
import {
  PincodeSchema,
  ServiceabilityInputSchema,
  WarehouseInputSchema,
  ShipmentCreateInputSchema,
  ShippingCostInputSchema,
} from "./types"
import { ValidationError } from "./errors"

export function validatePincode(pincode: string) {
  const result = PincodeSchema.safeParse(pincode)
  if (!result.success) {
    throw new ValidationError(result.error.errors[0]?.message ?? "Invalid pincode")
  }
  return result.data
}

export function validateServiceabilityInput(input: unknown) {
  const parsed = ServiceabilityInputSchema.safeParse(input)
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0]?.message ?? "Invalid serviceability input")
  }
  return parsed.data
}

export function validateWarehouseInput(input: unknown) {
  const parsed = WarehouseInputSchema.safeParse(input)
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0]?.message ?? "Invalid warehouse input")
  }
  return parsed.data
}

export function validateShipmentCreateInput(input: unknown) {
  const parsed = ShipmentCreateInputSchema.safeParse(input)
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.errors[0]?.message ?? "Invalid shipment create input"
    )
  }
  return parsed.data
}

export function validateShippingCostInput(input: unknown) {
  const parsed = ShippingCostInputSchema.safeParse(input)
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0]?.message ?? "Invalid shipping cost input")
  }
  return parsed.data
}

