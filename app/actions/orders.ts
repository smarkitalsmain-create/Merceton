"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"
import { calculatePlatformFee, calculateNetPayable, getEffectiveFeeConfigForFees } from "@/lib/fees"
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

    // Calculate platform fee using effective fee config (pricing package + overrides)
    const feeConfig = await getEffectiveFeeConfigForFees(merchant.id)
    const platformFeeInPaise = calculatePlatformFee(totalAmountInPaise, feeConfig)
    const netPayableInPaise = calculateNetPayable(totalAmountInPaise, feeConfig)

    // Convert to INR for database storage
    const grossAmountInInr = totalAmountInPaise / 100
    const platformFeeInInr = platformFeeInPaise / 100
    const netPayableInInr = netPayableInPaise / 100

    // Determine payment method (UPI maps to RAZORPAY for online payments)
    const paymentMethod = validatedInput.paymentMethod === "UPI" ? "RAZORPAY" : validatedInput.paymentMethod

    // Prepare stock updates (batch) - do this BEFORE transaction
    const stockUpdates = orderItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }))

    // Create order in transaction (DB-only, fast)
    // Must be interactive because ledger entries need orderId from order creation
    console.time("TX:orders:createOrder")
    let queryCount = 0
    
    const order = await prisma.$transaction(async (tx) => {
      queryCount++
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

      // Batch stock updates (parallel, but still in same transaction)
      queryCount += stockUpdates.length
      await Promise.all(
        stockUpdates.map((update) =>
          tx.product.update({
            where: { id: update.productId },
            data: {
              stock: {
                decrement: update.quantity,
              },
            },
          })
        )
      )

      // Create ledger entries (depends on newOrder.id)
      queryCount++
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
    }, { timeout: 15000, maxWait: 15000 })
    console.timeEnd(`TX:orders:createOrder (${queryCount} queries)`)

    // Validate stock after transaction (outside transaction)
    const updatedProducts = await prisma.product.findMany({
      where: {
        id: { in: stockUpdates.map((u) => u.productId) },
      },
      select: {
        id: true,
        name: true,
        stock: true,
      },
    })

    // Check for negative stock (should not happen, but safety check)
    for (const product of updatedProducts) {
      if (product.stock < 0) {
        // This is a critical error - rollback would be ideal but we're outside transaction
        // Log and alert - in production you might want to implement compensation
        logger.error("Stock went negative after order creation", {
          productId: product.id,
          productName: product.name,
          stock: product.stock,
          orderId: order.id,
        })
        // Note: In a real system, you might want to implement a compensation transaction
        // or alert system here
      }
    }

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
