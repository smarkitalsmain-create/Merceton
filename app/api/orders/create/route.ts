import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createOrderSchema } from "@/lib/validations/order"
import { logger } from "@/lib/logger"
import { createOrder } from "@/app/actions/orders"

/**
 * Public API endpoint for order creation
 * Rate limited: 10 requests per minute per IP
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request)
    if (!rateLimit(clientId, 10, 60000)) {
      logger.warn("Rate limit exceeded", { clientId })
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedInput = createOrderSchema.parse(body)

    // Create order via server action
    const result = await createOrder(validatedInput)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result.order, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Order creation validation failed", { errors: error.errors })
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }

    logger.error("Order creation API error", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
