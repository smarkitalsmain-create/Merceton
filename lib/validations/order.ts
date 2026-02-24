import { z } from "zod"

/**
 * Order creation validation schema
 */
export const createOrderSchema = z.object({
  merchantId: z.string().min(1, "Merchant ID is required"),
  storeSlug: z.string().min(1, "Store slug is required"),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product ID is required"),
        quantity: z.number().int().positive("Quantity must be positive"),
      })
    )
    .min(1, "At least one item is required")
    .max(50, "Maximum 50 items per order"),
  customerName: z.string().min(1, "Name is required").max(100, "Name too long"),
  customerEmail: z
    .string()
    .min(1, "Customer email is required")
    .email("Invalid email format"),
  customerPhone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number too long")
    .regex(/^[+]?[\d\s-()]+$/, "Invalid phone number format"),
  customerAddress: z.string().min(1, "Address is required").max(500, "Address too long"),
  paymentMethod: z.enum(["COD", "UPI", "RAZORPAY"], {
    errorMap: () => ({ message: "Invalid payment method" }),
  }),
  couponCode: z.string().optional().nullable(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
