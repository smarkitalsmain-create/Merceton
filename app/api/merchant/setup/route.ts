import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { isDbDownError } from "@/lib/db-error"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message, success: false }, { status })
}

function jsonOk<T extends Record<string, unknown>>(data: T, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status })
}

/**
 * GET — setup status for the signed-in user (has merchant / basic info).
 */
export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return jsonError("Unauthorized", 401)
    }

    const dbUser = await prisma.user.findUnique({
      where: { authUserId: user.id },
      include: {
        merchant: {
          select: {
            id: true,
            slug: true,
            displayName: true,
          },
        },
      },
    })

    if (!dbUser) {
      return jsonOk({
        setupComplete: false,
        hasMerchant: false,
        merchant: null,
      })
    }

    return jsonOk({
      setupComplete: Boolean(dbUser.merchant),
      hasMerchant: Boolean(dbUser.merchant),
      merchant: dbUser.merchant,
    })
  } catch (e: unknown) {
    if (isDbDownError(e)) {
      return jsonError("Service temporarily unavailable", 503)
    }
    console.error("[merchant/setup GET]", e)
    return jsonError("Failed to load setup status", 500)
  }
}

type SetupBody = {
  storeName?: string
  storeSlug?: string
  description?: string
}

/**
 * POST — create merchant + link user (onboarding store creation).
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return jsonError("Unauthorized", 401)
    }

    let body: SetupBody
    try {
      body = (await req.json()) as SetupBody
    } catch {
      return jsonError("Invalid JSON body", 400)
    }

    const storeName = typeof body.storeName === "string" ? body.storeName.trim() : ""
    const rawSlug = typeof body.storeSlug === "string" ? body.storeSlug.trim() : ""
    const description =
      typeof body.description === "string" ? body.description.trim() : undefined

    if (!storeName || storeName.length < 2) {
      return jsonError("Store name is required (at least 2 characters)", 400)
    }

    if (!rawSlug || !SLUG_REGEX.test(rawSlug)) {
      return jsonError(
        "Store URL must be lowercase letters, numbers, and hyphens only",
        400
      )
    }

    const email = user.email ?? `${user.id}@no-email.local`
    const name =
      (user.user_metadata?.name as string | undefined) ||
      (user.user_metadata?.full_name as string | undefined) ||
      null

    const dbUser = await prisma.user.upsert({
      where: { authUserId: user.id },
      update: { email, name },
      create: {
        authUserId: user.id,
        email,
        name,
        role: "ADMIN",
      },
      include: { merchant: true },
    })

    if (dbUser.merchantId && dbUser.merchant) {
      return jsonError("Store is already set up for this account", 409)
    }

    const result = await prisma.$transaction(async (tx) => {
      const merchant = await tx.merchant.create({
        data: {
          slug: rawSlug,
          displayName: storeName,
          storefront: {
            create: {
              mode: "THEME",
              theme: "minimal",
            },
          },
          storeSettings: {
            create: {
              storeName,
              description: description || null,
            },
          },
          onboarding: {
            create: {
              onboardingStatus: "NOT_STARTED",
              profileCompletionPercent: 0,
              gstStatus: "NOT_REGISTERED",
              storeDisplayName: storeName,
            },
          },
        },
      })

      await tx.user.update({
        where: { id: dbUser.id },
        data: { merchantId: merchant.id },
      })

      return merchant
    })

    return jsonOk({
      merchant: {
        id: result.id,
        slug: result.slug,
        displayName: result.displayName,
      },
    })
  } catch (e: unknown) {
    if (isDbDownError(e)) {
      return jsonError("Service temporarily unavailable", 503)
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        const target = (e.meta?.target as string[] | undefined)?.join(", ")
        if (target?.includes("slug")) {
          return jsonError("This store URL is already taken. Try another.", 409)
        }
        return jsonError("A unique field conflict occurred", 409)
      }
    }
    console.error("[merchant/setup POST]", e)
    return jsonError("Failed to create store", 500)
  }
}
