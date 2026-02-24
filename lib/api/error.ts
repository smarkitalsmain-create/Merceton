/**
 * Safe error handling for API routes
 * Prevents Prisma internals and stack traces from leaking to clients
 */

import { z } from "zod"
import { Prisma } from "@prisma/client"

export interface SafeApiError {
  message: string
  status: number
  issues?: Array<{ path: string[]; message: string }>
}

/**
 * Convert any error to a safe API error response
 * Never returns Prisma internals or stack traces
 */
export function toSafeApiError(error: unknown): SafeApiError {
  // Zod validation errors
  if (error instanceof z.ZodError) {
    return {
      message: "Validation error",
      status: 400,
      issues: error.errors.map((err) => ({
        path: err.path.map(String),
        message: err.message,
      })),
    }
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle known Prisma errors
    switch (error.code) {
      case "P2002":
        // Unique constraint violation
        return {
          message: "A record with this value already exists",
          status: 409,
        }
      case "P2003":
        // Foreign key constraint violation
        return {
          message: "Invalid reference to related record",
          status: 400,
        }
      case "P2025":
        // Record not found
        return {
          message: "Record not found",
          status: 404,
        }
      default:
        // Generic Prisma error - log internally but return safe message
        console.error("[Prisma Error]", {
          code: error.code,
          meta: error.meta,
          message: error.message,
        })
        return {
          message: "Database operation failed",
          status: 500,
        }
    }
  }

  // Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    console.error("[Prisma Validation Error]", error.message)
    return {
      message: "Invalid data format",
      status: 400,
    }
  }

  // Generic Error objects
  if (error instanceof Error) {
    // Check if it's a known safe error (from our code)
    const safeMessage = error.message
    if (
      safeMessage.includes("Unauthorized") ||
      safeMessage.includes("Forbidden") ||
      safeMessage.includes("Not found") ||
      safeMessage.includes("Validation")
    ) {
      return {
        message: safeMessage,
        status: (error as any).status || 400,
      }
    }

    // Unknown error - log but return safe message
    console.error("[Unknown Error]", {
      message: error.message,
      name: error.name,
      // Only log stack in development
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    })
    return {
      message: "Something went wrong",
      status: 500,
    }
  }

  // Unknown error type
  console.error("[Unknown Error Type]", error)
  return {
    message: "Something went wrong",
    status: 500,
  }
}

/**
 * Create a NextResponse from a safe error
 */
export function createErrorResponse(error: unknown): Response {
  const safeError = toSafeApiError(error)
  return new Response(
    JSON.stringify({
      error: safeError.message,
      ...(safeError.issues && { issues: safeError.issues }),
    }),
    {
      status: safeError.status,
      headers: { "Content-Type": "application/json" },
    }
  )
}
