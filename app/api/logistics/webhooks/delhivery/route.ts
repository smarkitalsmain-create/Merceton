import { NextRequest, NextResponse } from "next/server"
import { createErrorResponse } from "@/lib/api/error"

export const runtime = "nodejs"

/**
 * Webhook scaffold for Delhivery.
 *
 * TODO:
 * - Validate any signatures or auth headers once docs are finalized.
 * - Persist webhook payloads and map to normalized shipment tracking events.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    // TODO: Store inbound events safely (e.g., in a dedicated table) and enqueue processing job.
    console.log("[logistics/webhooks/delhivery] Received webhook", {
      receivedAt: new Date().toISOString(),
      // Intentionally do not log full body to avoid PII; log only top-level keys.
      keys: body && typeof body === "object" ? Object.keys(body) : [],
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return createErrorResponse(error)
  }
}

