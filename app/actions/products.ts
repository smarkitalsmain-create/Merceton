"use server"

import { revalidatePath } from "next/cache"
import { authorizeRequest, ensureTenantAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { inrToPaise } from "@/lib/utils/currency"
import { getMerchantOnboarding } from "@/lib/onboarding"
import {
  createProductSchema,
  updateProductSchema,
  type CreateProductData,
  type UpdateProductData,
} from "@/lib/validations/product"

/**
 * Create a new product
 */
export async function createProduct(data: CreateProductData) {
  try {
    // Authorize and get merchant
    const { merchant } = await authorizeRequest()

    // Get merchant onboarding to check GST status
    const onboarding = await getMerchantOnboarding(merchant.id)

    // Validate data
    const validated = createProductSchema.parse({
      ...data,
      merchantId: merchant.id, // Override with authenticated merchant
    })

    // If merchant is GST registered, validate GST/HSN fields are provided
    if (onboarding.gstStatus === "REGISTERED") {
      if (!validated.hsnOrSac || validated.hsnOrSac.trim() === "") {
        return { success: false, error: "HSN/SAC is required for GST registered merchants" }
      }
      if (validated.gstRate === undefined || validated.gstRate === null) {
        return { success: false, error: "GST rate is required for GST registered merchants" }
      }
      // Validate GST rate is one of the allowed values
      if (![0, 5, 12, 18, 28].includes(validated.gstRate)) {
        return { success: false, error: "GST rate must be 0, 5, 12, 18, or 28" }
      }
    }

    // Convert price and MRP from INR to paise
    const priceInPaise = inrToPaise(validated.price)
    const mrpInPaise = validated.mrp ? inrToPaise(validated.mrp) : null

    // Create product
    const product = await prisma.product.create({
      data: {
        merchantId: merchant.id,
        name: validated.name,
        description: validated.description || null,
        price: priceInPaise,
        mrp: mrpInPaise,
        sku: validated.sku || null,
        stock: validated.stock,
        isActive: true,
        // GST & HSN fields
        hsnOrSac: validated.hsnOrSac || null,
        gstRate: validated.gstRate ?? null,
        isTaxable: validated.isTaxable ?? true,
        images: validated.images
          ? {
              create: validated.images.map((img, idx) => ({
                url: img.url,
                alt: img.alt || null,
                sortOrder: idx,
              })),
            }
          : undefined,
      },
      include: {
        images: true,
      },
    })

    revalidatePath("/dashboard/products")
    return { success: true, product }
  } catch (error) {
    console.error("Create product error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to create product" }
  }
}

/**
 * Update a product
 */
export async function updateProduct(data: UpdateProductData) {
  try {
    // Authorize and get merchant
    const { merchant } = await authorizeRequest()

    // Validate data
    const validated = updateProductSchema.parse(data)

    // Get existing product
    const existingProduct = await prisma.product.findUnique({
      where: { id: validated.id },
    })

    if (!existingProduct) {
      return { success: false, error: "Product not found" }
    }

    // Ensure tenant access
    ensureTenantAccess(existingProduct.merchantId, merchant.id)

    // Get merchant onboarding to check GST status
    const onboarding = await getMerchantOnboarding(merchant.id)

    // If merchant is GST registered and GST fields are being updated, validate them
    if (onboarding.gstStatus === "REGISTERED") {
      if (validated.hsnOrSac !== undefined && (!validated.hsnOrSac || validated.hsnOrSac.trim() === "")) {
        return { success: false, error: "HSN/SAC is required for GST registered merchants" }
      }
      if (validated.gstRate !== undefined && validated.gstRate !== null) {
        if (![0, 5, 12, 18, 28].includes(validated.gstRate)) {
          return { success: false, error: "GST rate must be 0, 5, 12, 18, or 28" }
        }
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.description !== undefined)
      updateData.description = validated.description || null
    if (validated.price !== undefined)
      updateData.price = inrToPaise(validated.price)
    if (validated.mrp !== undefined)
      updateData.mrp = validated.mrp ? inrToPaise(validated.mrp) : null
    if (validated.sku !== undefined) updateData.sku = validated.sku || null
    if (validated.stock !== undefined) updateData.stock = validated.stock
    // GST & HSN fields
    if (validated.hsnOrSac !== undefined) updateData.hsnOrSac = validated.hsnOrSac || null
    if (validated.gstRate !== undefined) updateData.gstRate = validated.gstRate ?? null
    if (validated.isTaxable !== undefined) updateData.isTaxable = validated.isTaxable

    // Update product
    const product = await prisma.product.update({
      where: { id: validated.id },
      data: updateData,
      include: {
        images: true,
      },
    })

    revalidatePath("/dashboard/products")
    revalidatePath(`/dashboard/products/${product.id}`)
    return { success: true, product }
  } catch (error) {
    console.error("Update product error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to update product" }
  }
}

/**
 * Soft delete a product (set isActive to false)
 */
export async function deleteProduct(productId: string) {
  try {
    // Authorize and get merchant
    const { merchant } = await authorizeRequest()

    // Get existing product
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!existingProduct) {
      return { success: false, error: "Product not found" }
    }

    // Ensure tenant access
    ensureTenantAccess(existingProduct.merchantId, merchant.id)

    // Soft delete
    await prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    })

    revalidatePath("/dashboard/products")
    return { success: true }
  } catch (error) {
    console.error("Delete product error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to delete product" }
  }
}
