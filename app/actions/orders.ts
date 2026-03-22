"use server"

import { z } from "zod"
import {
  LedgerStatus,
  LedgerType,
  OrderStage,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"
import { prisma } from "@/lib/prisma"
import { createOrderSchema } from "@/lib/validations/order"
import { generateOrderNumber } from "@/lib/order/generateOrderNumber"
import { calculatePlatformFee, getEffectiveFeeConfigForFees } from "@/lib/fees"
import { getServiceability } from "@/lib/logistics/service"

export type CreateOrderResult =
  | { success: true; order: { id: string; orderNumber: string } }
  | { success: false; error: string }

export async function createOrder(input: unknown): Promise<CreateOrderResult> {
  try {
    const validated = createOrderSchema.parse(input)

    const merchant = await prisma.merchant.findFirst({
      where: {
        id: validated.merchantId,
        slug: validated.storeSlug,
        isActive: true,
      },
      select: { id: true },
    })

    if (!merchant) {
      return { success: false, error: "Store not found" }
    }

    try {
      const svc = await getServiceability("delhivery", { pincode: validated.pincode })
      if (!svc.success) {
        return {
          success: false,
          error: "Delivery temporarily unavailable at this pincode",
        }
      }
      if (!svc.serviceable || svc.isEmbargoed) {
        return {
          success: false,
          error: "Delivery not available at this pincode",
        }
      }
    } catch {
      return {
        success: false,
        error: "Unable to check delivery right now. Please try again.",
      }
    }

    const productIds = validated.items.map((i) => i.productId)
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        merchantId: merchant.id,
        isActive: true,
      },
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
    })

    if (products.length !== productIds.length) {
      return { success: false, error: "One or more products are unavailable" }
    }

    const byId = new Map(products.map((p) => [p.id, p]))

    let grossPaise = 0
    for (const line of validated.items) {
      const p = byId.get(line.productId)
      if (!p) {
        return { success: false, error: "Invalid product in order" }
      }
      if (p.stock < line.quantity) {
        return { success: false, error: `Insufficient stock for ${p.name}` }
      }
      grossPaise += p.price * line.quantity
    }

    const feeConfig = await getEffectiveFeeConfigForFees(merchant.id)
    const platformFeePaise = calculatePlatformFee(grossPaise, feeConfig)
    const netPaise = Math.max(0, grossPaise - platformFeePaise)

    const grossAmount = new Decimal((grossPaise / 100).toFixed(2))
    const platformFee = new Decimal((platformFeePaise / 100).toFixed(2))
    const netPayable = new Decimal((netPaise / 100).toFixed(2))

    const orderNumber = await generateOrderNumber(prisma)

    const shippingAddress = {
      pincode: validated.pincode,
      addressLine: validated.customerAddress,
    }

    const order = await prisma.$transaction(async (tx) => {
      for (const line of validated.items) {
        const updated = await tx.product.updateMany({
          where: {
            id: line.productId,
            merchantId: merchant.id,
            stock: { gte: line.quantity },
          },
          data: { stock: { decrement: line.quantity } },
        })
        if (updated.count !== 1) {
          throw new Error(`Insufficient stock for a product`)
        }
      }

      const created = await tx.order.create({
        data: {
          merchantId: merchant.id,
          orderNumber,
          customerName: validated.customerName,
          customerEmail: validated.customerEmail,
          customerPhone: validated.customerPhone,
          customerAddress: validated.customerAddress,
          shippingAddress,
          stage: OrderStage.NEW,
          status: OrderStatus.PLACED,
          paymentStatus: PaymentStatus.PENDING,
          subtotal: grossAmount,
          tax: new Decimal(0),
          shippingFee: new Decimal(0),
          discount: new Decimal(0),
          totalAmount: grossAmount,
          grossAmount,
          platformFee,
          netPayable,
          items: {
            create: validated.items.map((line) => {
              const p = byId.get(line.productId)!
              const img = p.images[0]
              return {
                productId: p.id,
                productName: p.name,
                sku: p.sku,
                imageUrl: img?.url ?? null,
                quantity: line.quantity,
                price: p.price,
              }
            }),
          },
          payment: {
            create: {
              merchantId: merchant.id,
              paymentMethod: validated.paymentMethod as PaymentMethod,
              status: PaymentStatus.PENDING,
              amount: grossAmount,
            },
          },
        },
      })

      await tx.ledgerEntry.createMany({
        data: [
          {
            merchantId: merchant.id,
            orderId: created.id,
            type: LedgerType.GROSS_ORDER_VALUE,
            amount: grossAmount,
            description: `Gross order value for ${orderNumber}`,
            status: LedgerStatus.PENDING,
          },
          {
            merchantId: merchant.id,
            orderId: created.id,
            type: LedgerType.PLATFORM_FEE,
            amount: platformFee,
            description: `Platform fee for ${orderNumber}`,
            status: LedgerStatus.PENDING,
          },
          {
            merchantId: merchant.id,
            orderId: created.id,
            type: LedgerType.ORDER_PAYOUT,
            amount: netPayable,
            description: `Net payout for ${orderNumber}`,
            status: LedgerStatus.PENDING,
          },
        ],
      })

      return created
    })

    return {
      success: true,
      order: { id: order.id, orderNumber: order.orderNumber },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const msg = error.errors.map((e) => e.message).join("; ")
      return { success: false, error: msg || "Validation failed" }
    }
    console.error("[createOrder]", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create order. Please try again.",
    }
  }
}
