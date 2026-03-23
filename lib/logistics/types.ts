import { z } from "zod"

export const PincodeSchema = z
  .string()
  .regex(/^\d{6}$/, "Pincode must be a 6-digit Indian postal code")

export type Pincode = z.infer<typeof PincodeSchema>

export type LogisticsProviderKey = "delhivery" | string

export const ServiceabilityInputSchema = z.object({
  pincode: PincodeSchema,
})

export type ServiceabilityInput = z.infer<typeof ServiceabilityInputSchema>

export const ServiceabilityResultSchema = z.object({
  // Normalized Merceton fields
  success: z.boolean().default(true),
  pincode: PincodeSchema,
  serviceable: z.boolean(),
  isEmbargoed: z.boolean().default(false),
  message: z.string().default(""),
  // Optional provider-specific hints
  cod: z.boolean().optional(),
  estimatedDeliveryDays: z.number().int().nonnegative().optional(),
  raw: z.unknown().optional(),
})

export type ServiceabilityResult = z.infer<typeof ServiceabilityResultSchema>

export const WarehouseInputSchema = z.object({
  externalId: z.string().optional(),
  name: z.string().min(1),
  contactName: z.string().min(1),
  contactPhone: z.string().min(6),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: PincodeSchema,
})

export type WarehouseInput = z.infer<typeof WarehouseInputSchema>

export const WarehouseResultSchema = WarehouseInputSchema.extend({
  providerWarehouseId: z.string(),
  raw: z.unknown().optional(),
})

export type WarehouseResult = z.infer<typeof WarehouseResultSchema>

export const ShipmentCreateInputSchema = z.object({
  orderId: z.string().min(1),
  merchantId: z.string().min(1),
  providerWarehouseId: z.string().min(1),
  toName: z.string().min(1),
  toPhone: z.string().min(6),
  toAddressLine1: z.string().min(1),
  toAddressLine2: z.string().optional(),
  toCity: z.string().min(1),
  toState: z.string().min(1),
  toPincode: PincodeSchema,
  codAmount: z.number().nonnegative().optional(),
  totalWeightGrams: z.number().positive().optional(),
  lengthCm: z.number().positive().optional(),
  widthCm: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
})

export type ShipmentCreateInput = z.infer<typeof ShipmentCreateInputSchema>

export const ShipmentCreateResultSchema = z.object({
  providerShipmentId: z.string(),
  awb: z.string(),
  trackingUrl: z.string().url().optional(),
  status: z.enum([
    "pending",
    "serviceable",
    "packed",
    "shipment_created",
    "label_generated",
    "pickup_scheduled",
    "in_transit",
    "out_for_delivery",
    "delivered",
    "failed_delivery",
    "returned",
    "cancelled",
  ]),
  raw: z.unknown().optional(),
})

export type ShipmentCreateResult = z.infer<typeof ShipmentCreateResultSchema>

export const LabelResultSchema = z.object({
  awb: z.string(),
  contentType: z.string().default("application/pdf"),
  data: z.instanceof(Buffer),
})

export type LabelResult = z.infer<typeof LabelResultSchema>

export const TrackingEventSchema = z.object({
  status: z.string(),
  statusCode: z.string().optional(),
  normalizedStatus: ShipmentCreateResultSchema.shape.status,
  description: z.string().optional(),
  location: z.string().optional(),
  occurredAt: z.date(),
  raw: z.unknown().optional(),
})

export type TrackingEvent = z.infer<typeof TrackingEventSchema>

export const TrackingResultSchema = z.object({
  awb: z.string(),
  currentStatus: TrackingEventSchema,
  events: z.array(TrackingEventSchema),
  raw: z.unknown().optional(),
})

export type TrackingResult = z.infer<typeof TrackingResultSchema>

export const ShippingCostInputSchema = z.object({
  // Provider is optional because the backend route typically derives it.
  provider: z.string().optional(),
  originPincode: PincodeSchema,
  destinationPincode: PincodeSchema,
  // Chargeable weight in grams. Checkout currently doesn't collect weight, so
  // we use a safe default in the route/provider until we wire real package data.
  weightGrams: z.number().positive().optional(),
  paymentMode: z.enum(["prepaid", "cod"]).optional(),
  codAmount: z.number().nonnegative().optional(),
  merchantId: z.string().optional(),
})

export type ShippingCostInput = z.infer<typeof ShippingCostInputSchema>

export const ShippingCostResultSchema = z.object({
  success: z.boolean(),
  serviceable: z.boolean(),
  estimatedShippingCostPaise: z.number().int().nullable(),
  estimatedShippingCostInr: z.number().nullable(),
  currency: z.literal("INR"),
  message: z.string(),
  raw: z.unknown().optional(),
})

export type ShippingCostResult = z.infer<typeof ShippingCostResultSchema>

