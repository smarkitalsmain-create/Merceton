import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const displayNameRaw = body?.displayName ?? body?.storeName ?? "";
    const slugRaw = body?.slug ?? body?.storeSlug ?? "";

    const displayName = String(displayNameRaw).trim();
    const slug = slugify(String(slugRaw));

    if (!displayName) {
      return NextResponse.json({ error: "Store name is required" }, { status: 400 });
    }
    if (!slug || slug.length < 3) {
      return NextResponse.json(
        { error: "Store URL is required (min 3 chars)" },
        { status: 400 }
      );
    }

    // Make sure DB user exists (your requireUser does this too, but we keep it safe here)
    const dbUser = await prisma.user.findUnique({
      where: { authUserId: userId },
      select: { id: true, merchantId: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User record not found in DB. Visit /onboarding/create-store again." },
        { status: 400 }
      );
    }

    // If already has a merchant, return it
    if (dbUser.merchantId) {
      const existing = await prisma.merchant.findUnique({
        where: { id: dbUser.merchantId },
      });
      return NextResponse.json({ merchant: existing, alreadySetup: true }, { status: 200 });
    }

    // Slug uniqueness check
    const slugTaken = await prisma.merchant.findUnique({ where: { slug } });
    if (slugTaken) {
      return NextResponse.json(
        { error: "This Store URL is already taken. Try a different one." },
        { status: 409 }
      );
    }

    // Create merchant + storefront + link user in ONE transaction
    const result = await prisma.$transaction(async (tx) => {
      const merchant = await tx.merchant.create({
        data: {
          displayName,
          slug,
          isActive: true,
          storefront: {
            create: {
              theme: "minimal",
            },
          },
        },
      });

      const user = await tx.user.update({
        where: { authUserId: userId },
        data: {
          merchantId: merchant.id,
          role: "ADMIN",
        },
        include: { merchant: true },
      });

      return { merchant, user };
    });

    return NextResponse.json(
      { merchant: result.merchant, user: result.user },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/merchant/setup failed:", err);

    // Prisma common unique errors etc.
    const message =
      typeof err?.message === "string" ? err.message : "Failed to create store";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
