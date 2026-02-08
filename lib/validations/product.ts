import { z } from "zod"

/**
 * Product image schema
 */
export const productImageSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  alt: z.string().optional(),
})

/**
 * Product form schema
 * Price and MRP are in INR (decimal), will be converted to paise
 */
export const productFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  description: z.string().optional(),
  price: z.number().min(0.01, "Price must be greater than 0"),
  mrp: z.number().min(0.01, "MRP must be greater than 0").optional(),
  sku: z.string().max(100, "SKU is too long").optional(),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  images: z.array(productImageSchema).optional(),
})

export type ProductFormData = z.infer<typeof productFormSchema>

/**
 * Product creation schema (includes merchantId)
 */
export const createProductSchema = productFormSchema.extend({
  merchantId: z.string().min(1, "Merchant ID is required"),
})

export type CreateProductData = z.infer<typeof createProductSchema>

/**
 * Product update schema
 */
export const updateProductSchema = productFormSchema.partial().extend({
  id: z.string().min(1, "Product ID is required"),
})

export type UpdateProductData = z.infer<typeof updateProductSchema>
