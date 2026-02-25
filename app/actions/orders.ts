"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"
import { calculatePlatformFee, calculateNetPayable, getEffectiveFeeConfigForFees } from "@/lib/fees"
import { createOrderSchema, type CreateOrderInput } from "@/lib/validations/order"
import { logger } from "@/lib/logger"
import { z } from "zod"
import { validateCoupon, calculateDiscount } from "@/lib/coupons/validation"
import { LedgerType } from "@prisma/client"

export async function createOrder(input: unknown) {
  // DEV-only: Log incoming request
  if (process.env.NODE_ENV === "development") {
    console.log("[createOrder] Received request:", {
      hasInput: !!input,
      inputKeys: input ? Object.keys(input as object) : [],
    })
  }

  try {
    // Validate input with Zod
    const validatedInput = createOrderSchema.parse(input) as CreateOrderInput

    if (process.env.NODE_ENV === "development") {
      console.log("[createOrder] Validation passed:", {
        merchantId: validatedInput.merchantId,
        storeSlug: validatedInput.storeSlug,
        itemCount: validatedInput.items.length,
        paymentMethod: validatedInput.paymentMethod,
      })
    }

    logger.info("Order creation started", {
      merchantId: validatedInput.merchantId,
      itemCount: validatedInput.items.length,
    })

    // Validate customer email
    const customerEmail = validatedInput.customerEmail?.trim() || "";
    if (!customerEmail) {
      return { success: false, error: "Customer email is required to place an order" };
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return { success: false, error: "Customer email is required to place an order" };
    }

    // Verify merchant exists and get merchant email
    const merchant = await prisma.merchant.findUnique({
      where: { id: validatedInput.merchantId, slug: validatedInput.storeSlug, isActive: true },
      include: {
        users: {
          where: { role: "ADMIN" },
          take: 1,
          select: { email: true },
        },
      },
    })

    if (!merchant) {
      return { success: false, error: "Merchant not found" }
    }

    // Get merchant email from associated user account
    const merchantEmail = merchant.users[0]?.email;
    if (!merchantEmail || !merchantEmail.trim()) {
      console.error("[order-creation] Merchant email missing for store", {
        merchantId: merchant.id,
        storeSlug: validatedInput.storeSlug,
      });
      return { success: false, error: "Merchant email missing for store" };
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

    // Generate uniform order number (atomic, concurrency-safe)
    if (process.env.NODE_ENV === "development") {
      console.log("[createOrder] Generating order number...")
    }
    
    const { generateOrderNumber } = await import("@/lib/order/generateOrderNumber");
    let orderNumber: string;
    try {
      orderNumber = await generateOrderNumber(prisma);
      if (process.env.NODE_ENV === "development") {
        console.log("[createOrder] Order number generated:", orderNumber)
      }
    } catch (error: any) {
      console.error("[createOrder] Failed to generate order number:", error)
      logger.error("Order number generation failed", {
        merchantId: validatedInput.merchantId,
        error: error instanceof Error ? error.message : String(error),
        code: error?.code,
      })
      
      // Check for specific Prisma errors
      if (error?.code === "P2021") {
        // Table does not exist
        console.error("[createOrder] CRITICAL: order_number_counters table missing!")
        console.error("[createOrder] Run: npm run db:push")
        return { 
          success: false, 
          error: "Database schema is out of sync. Please contact support or try again later." 
        }
      }
      
      if (error?.code === "P1001") {
        // Database connection error
        return { 
          success: false, 
          error: "Database connection failed. Please try again later." 
        }
      }
      
      return { success: false, error: "Failed to generate order number. Please try again." }
    }

    // Validate and apply coupon if provided.
    // In this deployment, coupon tables are not provisioned; reject orders that try to use coupons.
    let discountInInr = 0
    let couponId: string | null = null
    let couponCode: string | null = null

    if (validatedInput.couponCode) {
      return {
        success: false,
        error: "Coupons not available: database not provisioned",
      }
    }

    // Calculate platform fee on PRE-DISCOUNT amount (grossAmount)
    // This ensures platform fee is calculated on the original order value
    const feeConfig = await getEffectiveFeeConfigForFees(merchant.id)
    const platformFeeInPaise = calculatePlatformFee(totalAmountInPaise, feeConfig)
    
    // Calculate net payable: grossAmount - discount - platformFee
    const grossAmountInInr = totalAmountInPaise / 100
    const discountInPaise = Math.round(discountInInr * 100)
    const amountAfterDiscountInPaise = totalAmountInPaise - discountInPaise
    const netPayableInPaise = amountAfterDiscountInPaise - platformFeeInPaise
    
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
    if (process.env.NODE_ENV === "development") {
      console.log("[createOrder] Starting transaction to create order...")
    }
    
    console.time("TX:orders:createOrder")
    let queryCount = 0
    
    let order;
    try {
      order = await prisma.$transaction(async (tx) => {
      queryCount++
      // Create order
      const newOrder = await tx.order.create({
        data: {
          merchantId: merchant.id,
          orderNumber,
          customerName: validatedInput.customerName,
          customerEmail: customerEmail,
          customerPhone: validatedInput.customerPhone,
          customerAddress: validatedInput.customerAddress,
          status: paymentMethod === "COD" ? "PLACED" : "PENDING",
          grossAmount: new Decimal(grossAmountInInr),
          discount: new Decimal(discountInInr),
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
              amount: new Decimal(netPayableInInr), // Payment amount is after discount
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
      const ledgerEntries: {
        merchantId: string
        orderId: string
        type: LedgerType
        amount: Decimal
        description: string
        status: "PENDING"
      }[] = [
        {
          merchantId: merchant.id,
          orderId: newOrder.id,
          type: LedgerType.GROSS_ORDER_VALUE,
          amount: new Decimal(grossAmountInInr), // Positive (credit)
          description: `Gross order value for ${orderNumber}`,
          status: "PENDING",
        },
      ]

      // Add discount ledger entry if coupon was applied
      if (discountInInr > 0 && couponCode) {
        // Map coupon discount to a negative PLATFORM_FEE entry so we don't rely on a custom enum.
        ledgerEntries.push({
          merchantId: merchant.id,
          orderId: newOrder.id,
          type: LedgerType.PLATFORM_FEE,
          amount: new Decimal(discountInInr * -1), // Negative (debit)
          description: `Coupon discount (${couponCode}) for ${orderNumber}`,
          status: "PENDING" as const,
        })
      }

      ledgerEntries.push(
        {
          merchantId: merchant.id,
          orderId: newOrder.id,
          type: LedgerType.PLATFORM_FEE,
          amount: new Decimal(platformFeeInInr * -1), // Negative (debit)
          description: `Platform fee for ${orderNumber}`,
          status: "PENDING" as const,
        },
        {
          merchantId: merchant.id,
          orderId: newOrder.id,
          type: LedgerType.ORDER_PAYOUT,
          amount: new Decimal(netPayableInInr), // Positive (credit to merchant)
          description: `Net payable for ${orderNumber}`,
          status: "PENDING" as const,
        }
      )

      await tx.ledgerEntry.createMany({
        data: ledgerEntries,
      })

        return newOrder
      }, { timeout: 15000, maxWait: 15000 })
      console.timeEnd(`TX:orders:createOrder (${queryCount} queries)`)
      
      if (process.env.NODE_ENV === "development") {
        console.log("[createOrder] Order created successfully:", {
          orderId: order.id,
          orderNumber: order.orderNumber,
          merchantId: order.merchantId,
        })
      }
    } catch (txError) {
      console.error("[createOrder] Transaction failed:", txError)
      logger.error("Order creation transaction failed", {
        merchantId: validatedInput.merchantId,
        orderNumber,
        error: txError instanceof Error ? txError.message : String(txError),
      })
      return { success: false, error: "Failed to create order. Please try again." }
    }

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

    // Email trigger A: Order confirmation to buyer/customer (non-blocking)
    // Send order confirmation email to customer
    try {
      const { sendOrderConfirmationEmailToCustomer } = await import("@/lib/email/notifications");
      const items = order.items.map((item) => ({
        name: item.product?.name || item.productName || "Product",
        qty: item.quantity,
        price: item.price / 100, // Convert from paise to INR
      }));

      await sendOrderConfirmationEmailToCustomer({
        to: customerEmail,
        customerName: order.customerName,
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderDate: order.createdAt.toISOString(),
        items,
        totalAmount: order.grossAmount.toNumber(),
        currency: "INR",
        storeName: merchant.displayName,
      });

      console.log(`[email][customer] orderId=${order.orderNumber} to=${customerEmail}`);
    } catch (emailError) {
      // Log but don't fail order creation
      console.error(`[email][customer] Failed to send order confirmation: orderId=${order.orderNumber} to=${customerEmail}`, emailError);
    }

    // Email trigger B: New order notification to merchant (non-blocking)
    try {
      const { sendNewOrderEmailToMerchant } = await import("@/lib/email/notifications");
      const items = order.items.map((item) => ({
        name: item.product?.name || item.productName || "Product",
        qty: item.quantity,
        price: item.price / 100, // Convert from paise to INR
      }));

      await sendNewOrderEmailToMerchant({
        to: merchantEmail,
        merchantName: merchant.displayName,
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderDate: order.createdAt.toISOString(),
        customerName: order.customerName,
        customerEmail: customerEmail,
        customerPhone: order.customerPhone || undefined,
        items,
        totalAmount: order.grossAmount.toNumber(),
        currency: "INR",
        paymentMethod: order.payment?.paymentMethod || undefined,
        adminUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/orders/${order.id}`,
      });

      console.log(`[email][merchant] orderId=${order.orderNumber} to=${merchantEmail}`);
    } catch (emailError) {
      // Log but don't fail order creation
      console.error(`[email][merchant] Failed to send new order notification: orderId=${order.orderNumber} to=${merchantEmail}`, emailError);
    }

    // Email trigger B: High value order internal alert to ops (non-blocking)
    // Send internal alert if order amount exceeds threshold (threshold is in paise)
    const highValueThresholdPaise = Number(process.env.HIGH_VALUE_ORDER_THRESHOLD || "50000");
    const orderAmountInPaise = order.grossAmount.toNumber() * 100; // Convert INR to paise
    if (orderAmountInPaise >= highValueThresholdPaise) {
      try {
        const { sendOpsHighValueOrderAlert } = await import("@/lib/email/notifications");
        const opsEmail = process.env.OPS_ALERT_TO || "ops@merceton.com";
        
        await sendOpsHighValueOrderAlert({
          orderId: order.id, // Internal ID for tracking
          orderNumber: order.orderNumber, // Human-readable for display
          storeName: merchant.displayName,
          amount: order.grossAmount.toNumber(),
          currency: "INR",
          customerEmail: customerEmail || undefined,
          paymentMode: order.payment?.paymentMethod || undefined,
          createdAt: order.createdAt.toISOString(),
          adminUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/orders/${order.id}`,
        });

        console.log(`[email][ops-high-value] to=${opsEmail} orderNumber=${order.orderNumber}`);
      } catch (emailError) {
        console.error("[email][ops-high-value] Failed to send high value order alert:", emailError);
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[createOrder] Order creation completed successfully:", {
        orderId: order.id,
        orderNumber: order.orderNumber,
      })
    }

    return { success: true, order }
  } catch (error) {
    console.error("[createOrder] Fatal error:", error)
    logger.error("Order creation failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    
    // Return user-friendly error message
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Validation failed: ${error.errors.map(e => e.message).join(", ")}` 
      }
    }
    
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    
    return { success: false, error: "Failed to create order. Please try again." }
  }
}
