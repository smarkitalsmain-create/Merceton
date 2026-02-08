import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { razorpay } from "@/lib/razorpay"

/**
 * Create Razorpay order for online payment
 * 
 * Security:
 * - Validates order belongs to merchant
 * - Validates payment method is RAZORPAY
 * - Validates payment status is CREATED
 * - Creates Razorpay order with correct amount
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        merchant: true,
        payment: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    if (!order.payment) {
      return NextResponse.json(
        { error: "Payment record not found" },
        { status: 404 }
      )
    }

    // Validate payment method
    if (order.payment.paymentMethod !== "RAZORPAY") {
      return NextResponse.json(
        { error: "Payment method is not RAZORPAY" },
        { status: 400 }
      )
    }

    // Validate payment status
    if (order.payment.status !== "CREATED") {
      return NextResponse.json(
        { error: `Payment status is ${order.payment.status}, expected CREATED` },
        { status: 400 }
      )
    }

    // Prevent duplicate Razorpay order creation
    if (order.payment.razorpayOrderId) {
      return NextResponse.json(
        {
          razorpayOrderId: order.payment.razorpayOrderId,
          amount: Math.round(order.payment.amount.toNumber() * 100),
        },
        { status: 200 }
      )
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.payment.amount.toNumber() * 100), // Convert to paise
      currency: "INR",
      receipt: order.orderNumber,
      notes: {
        orderId: order.id,
        merchantId: order.merchantId,
        storeSlug: order.merchant.slug,
      },
    })

    // Update payment with Razorpay order ID
    await prisma.payment.update({
      where: { id: order.payment.id },
      data: { razorpayOrderId: razorpayOrder.id },
    })

    return NextResponse.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    })
  } catch (error) {
    console.error("Razorpay order creation error:", error)
    return NextResponse.json(
      { error: "Failed to create Razorpay order" },
      { status: 500 }
    )
  }
}
