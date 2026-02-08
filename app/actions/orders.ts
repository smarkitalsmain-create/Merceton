"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"
import { calculatePlatformFee, calculateNetPayable, getFeeConfig } from "@/lib/fees"
import { createOrderSchema, type CreateOrderInput } from "@/lib/validations/order"
import { logger } from "@/lib/logger"
import { z } from "zod"

export async function createOrder(input: unknown) {
  try {
    // Validate input with Zod
    const validatedInput = createOrderSchema.parse(input) as CreateOrderInput

    logger.info("Order creation started", {
      merchantId: validatedInput.merchantId,
      itemCount: validatedInput.items.length,
    })
    // Verify merchant exists
    const merchant = await prisma.merchant.findUnique({
      where: { id: validatedInput.merchantId, slug: validatedInput.storeSlug, isActive: true },
    })

    if (!merchant) {
      return { success: false, error: "Merchant not found" }
    }

    // Fetch all products and validate
    const productIds = validatedInput.items.map((item) => item.productId)
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        merchantId: merchant.id,
        isActive: true,
      },
    })

    if (products.length !== productIds.length) {
      return { success: false, error: "Some products not found" }
    }

    // Validate stock and calculate totals
    let totalAmountInPaise = 0
    const orderItems: Array<{
      productId: string
      quantity: number
      price: number
    }> = []

    for (const item of validatedInput.items) {
      const product = products.find((p) => p.id === item.productId)
      if (!product) {
        return { success: false, error: `Product ${item.productId} not found` }
      }

      if (product.stock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
        }
      }

      const itemTotal = product.price * item.quantity
      totalAmountInPaise += itemTotal

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price, // Already in paise
      })
    }

    // Generate order number
    const today = new Date()
    const year = today.getFullYear()
    const lastOrder = await prisma.order.findFirst({
      where: {
        merchantId: merchant.id,
        orderNumber: {
          startsWith: `ORD-${year}-`,
        },
      },
      orderBy: { createdAt: "desc" },
    })

    let orderNumber: string
    if (lastOrder) {
      const lastNum = parseInt(lastOrder.orderNumber.split("-")[2] || "0")
      orderNumber = `ORD-${year}-${String(lastNum + 1).padStart(3, "0")}`
    } else {
      orderNumber = `ORD-${year}-001`
    }

    // Calculate platform fee using merchant's fee config (or defaults)
    const feeConfig = getFeeConfig(merchant)
    const platformFeeInPaise = calculatePlatformFee(totalAmountInPaise, feeConfig)
    const netPayableInPaise = calculateNetPayable(totalAmountInPaise, feeConfig)

    // Convert to INR for database storage
    const grossAmountInInr = totalAmountInPaise / 100
    const platformFeeInInr = platformFeeInPaise / 100
    const netPayableInInr = netPayableInPaise / 100

    // Determine payment method (UPI maps to RAZORPAY for online payments)
    const paymentMethod = validatedInput.paymentMethod === "UPI" ? "RAZORPAY" : validatedInput.paymentMethod

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          merchantId: merchant.id,
          orderNumber,
          customerName: validatedInput.customerName,
          customerEmail: "", // Not collected in MVP
          customerPhone: validatedInput.customerPhone,
          customerAddress: validatedInput.customerAddress,
          status: paymentMethod === "COD" ? "PLACED" : "PENDING",
          grossAmount: new Decimal(grossAmountInInr),
          platformFee: new Decimal(platformFeeInInr),
          netPayable: new Decimal(netPayableInInr),
          items: {
            create: orderItems,
          },
          payment: {
            create: {
              merchantId: merchant.id,
              paymentMethod: paymentMethod,
              status: paymentMethod === "COD" ? "PENDING" : "CREATED",
              amount: new Decimal(grossAmountInInr), // Payment amount is gross
            },
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          payment: true,
        },
      })

      // Update stock (prevent negative)
      for (const item of validatedInput.items) {
        const product = products.find((p) => p.id === item.productId)
        if (!product) {
          throw new Error(`Product ${item.productId} not found`)
        }
        
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        })

        // Double-check stock didn't go negative
        const updated = await tx.product.findUnique({
          where: { id: product.id },
          select: { stock: true },
        })

        if (updated && updated.stock < 0) {
          throw new Error(`Insufficient stock for ${product.name}`)
        }
      }

      // Create ledger entries (source of truth)
      await tx.ledgerEntry.createMany({
        data: [
          {
            merchantId: merchant.id,
            orderId: newOrder.id,
            type: "GROSS_ORDER_VALUE",
            amount: new Decimal(grossAmountInInr), // Positive (credit)
            description: `Gross order value for ${orderNumber}`,
            status: "PENDING",
          },
          {
            merchantId: merchant.id,
            orderId: newOrder.id,
            type: "PLATFORM_FEE",
            amount: new Decimal(platformFeeInInr * -1), // Negative (debit)
            description: `Platform fee for ${orderNumber}`,
            status: "PENDING",
          },
          {
            merchantId: merchant.id,
            orderId: newOrder.id,
            type: "ORDER_PAYOUT",
            amount: new Decimal(netPayableInInr), // Positive (credit to merchant)
            description: `Net payable for ${orderNumber}`,
            status: "PENDING",
          },
        ],
      })

      return newOrder
    })

    revalidatePath(`/s/${validatedInput.storeSlug}`)
    return { success: true, order }
  } catch (error) {
    console.error("Create order error:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to create order" }
  }
}
