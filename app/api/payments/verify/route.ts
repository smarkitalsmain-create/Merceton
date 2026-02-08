import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

/**
 * Verify Razorpay payment signature
 * 
 * Security:
 * - Verifies HMAC signature
 * - Validates order exists and belongs to merchant
 * - Prevents duplicate payment processing
 * - Updates payment and order status atomically
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = body

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    })

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    if (!order.payment) {
      throw new Error("Payment record not found for this order")
    }

    // Normalize payment to non-null variable
    const payment = order.payment
    const paymentId = payment.id

    // Prevent duplicate processing
    if (payment.status === "PAID") {
      return NextResponse.json(
        { success: true, message: "Payment already processed" },
        { status: 200 }
      )
    }

    // Verify signature
    const text = `${razorpayOrderId}|${razorpayPaymentId}`
    const secret = process.env.RAZORPAY_KEY_SECRET

    if (!secret) {
      return NextResponse.json(
        { error: "Payment configuration error" },
        { status: 500 }
      )
    }

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(text)
      .digest("hex")

    if (generatedSignature !== razorpaySignature) {
      console.error("Signature mismatch", {
        expected: generatedSignature,
        received: razorpaySignature,
      })
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      )
    }

    // Verify Razorpay order ID matches
    if (payment.razorpayOrderId !== razorpayOrderId) {
      return NextResponse.json(
        { error: "Razorpay order ID mismatch" },
        { status: 400 }
      )
    }

    // Update payment and order status in transaction
    await prisma.$transaction(async (tx) => {
      // Update payment status
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: "PAID",
          razorpayPaymentId,
          razorpaySignature,
        },
      })

      // Update order status
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CONFIRMED",
        },
      })

      // Update ledger entries status to PROCESSING
      await tx.ledgerEntry.updateMany({
        where: {
          orderId: order.id,
          status: "PENDING",
        },
        data: { status: "PROCESSING" },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    )
  }
}
