export const runtime = "nodejs"

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, prismaTx } from "@/lib/prisma";

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

    // Slug uniqueness check (BEFORE transaction)
    const slugTaken = await prisma.merchant.findUnique({ where: { slug } });
    if (slugTaken) {
      return NextResponse.json(
        { error: "This Store URL is already taken. Try a different one." },
        { status: 409 }
      );
    }

    // Get default pricing package (BEFORE transaction)
    const platformSettings = await prisma.platformSettings.findUnique({
      where: { id: "singleton" },
      select: { defaultPricingPackageId: true },
    })

    // Prepare layout JSON (BEFORE transaction - no computation inside)
    const defaultLayoutJson = {
      sections: [
        {
          id: "hero-1",
          type: "hero",
          settings: {
            headline: `Welcome to ${displayName}`,
            subheadline: "Browse our latest products and offers.",
            ctaText: "Shop Now",
            ctaLink: `/s/${slug}`,
          },
        },
        {
          id: "products-1",
          type: "productGrid",
          settings: {
            title: "Featured Products",
            collection: "featured",
            limit: 8,
          },
        },
        {
          id: "footer-1",
          type: "footer",
          settings: {
            brandName: displayName,
            links: [],
          },
        },
      ],
    }

    // Create merchant + storefront + default home page + fee config + link user in ONE transaction (DB-only)
    // Use prismaTx (DIRECT_URL) for this heavy onboarding transaction
    console.time("TX:merchant/setup:POST")
    let queryCount = 0
    const result = await prismaTx.$transaction(async (tx) => {
      queryCount++
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
          pages: {
            create: {
              slug: "home",
              title: `${displayName} Home`,
              layoutJson: defaultLayoutJson,
              isPublished: true,
            },
          },
          feeConfig: {
            create: {
              pricingPackageId: platformSettings?.defaultPricingPackageId || null,
            },
          },
        },
      });

      queryCount++
      // Remove include to reduce query overhead - we can fetch separately if needed
      const user = await tx.user.update({
        where: { authUserId: userId },
        data: {
          merchantId: merchant.id,
          role: "ADMIN",
        },
      });

      return { merchant, user };
    }, { timeout: 20000, maxWait: 20000 });
    console.timeEnd(`TX:merchant/setup:POST (${queryCount} queries)`)
    
    // Fetch user with merchant relation AFTER transaction if needed
    const userWithMerchant = await prisma.user.findUnique({
      where: { authUserId: userId },
      include: { merchant: true },
    });
    
    return NextResponse.json(
      { merchant: result.merchant, user: userWithMerchant || result.user },
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
