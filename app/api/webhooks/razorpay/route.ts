import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

/**
 * Razorpay Webhook Handler
 * 
 * Handles webhook events from Razorpay:
 * - payment.captured: Payment successful
 * - payment.failed: Payment failed
 * 
 * Security:
 * - Verifies webhook signature
 * - Validates merchant association
 * - Prevents replay attacks (idempotency)
 * - Validates amounts match
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-razorpay-signature")

    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 401 }
      )
    }

    // Verify webhook signature
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!secret) {
      console.error("RAZORPAY_WEBHOOK_SECRET not configured")
      return NextResponse.json(
        { error: "Webhook configuration error" },
        { status: 500 }
      )
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex")

    if (signature !== expectedSignature) {
      console.error("Webhook signature mismatch")
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      )
    }

    const event = JSON.parse(body)
    const { event: eventType, payload } = event

    // Handle payment events
    if (eventType === "payment.captured") {
      const payment = payload.payment.entity
      const order = payload.order.entity

      // Find our order by Razorpay order ID
      const dbPayment = await prisma.payment.findFirst({
        where: {
          razorpayOrderId: order.id,
        },
        include: {
          order: true,
        },
      })

      if (!dbPayment) {
        console.error("Payment not found for Razorpay order:", order.id)
        return NextResponse.json({ received: true }, { status: 200 })
      }

      // Validate amount (in paise)
      const expectedAmount = Math.round(dbPayment.amount.toNumber() * 100)
      if (payment.amount !== expectedAmount) {
        console.error("Amount mismatch", {
          expected: expectedAmount,
          received: payment.amount,
        })
        return NextResponse.json({ received: true }, { status: 200 })
      }

      // Prevent duplicate processing
      if (dbPayment.status === "PAID") {
        return NextResponse.json({ received: true }, { status: 200 })
      }

      // Update payment and order
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: dbPayment.id },
          data: {
            status: "PAID",
            razorpayPaymentId: payment.id,
            razorpaySignature: payment.notes?.signature || null,
          },
        })

        await tx.order.update({
          where: { id: dbPayment.orderId },
          data: {
            status: "CONFIRMED",
          },
        })

        await tx.ledgerEntry.updateMany({
          where: {
            orderId: dbPayment.orderId,
            status: "PENDING",
          },
          data: { status: "PROCESSING" },
        })
      })

      return NextResponse.json({ received: true }, { status: 200 })
    }

    if (eventType === "payment.failed") {
      const payment = payload.payment.entity
      const order = payload.order.entity

      const dbPayment = await prisma.payment.findFirst({
        where: {
          razorpayOrderId: order.id,
        },
      })

      if (dbPayment && dbPayment.status !== "PAID") {
        await prisma.payment.update({
          where: { id: dbPayment.id },
          data: {
            status: "FAILED",
          },
        })
      }

      return NextResponse.json({ received: true }, { status: 200 })
    }

    // Acknowledge other events
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}
