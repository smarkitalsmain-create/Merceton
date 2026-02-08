import { NextRequest, NextResponse } from "next/server"
import { authorizeRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Example API route demonstrating tenant isolation
 * 
 * GET /api/products - List products for current merchant
 * POST /api/products - Create product for current merchant
 * 
 * All operations are automatically scoped to the authenticated user's merchant
 */
export async function GET(request: NextRequest) {
  try {
    // Authorize request - ensures user is authenticated and has merchant
    // Returns { user, merchant } with tenant isolation guaranteed
    const { merchant } = await authorizeRequest()

    // Get products - MUST be scoped to merchant.id
    // This ensures tenant isolation even if someone tries to manipulate the request
    const products = await prisma.product.findMany({
      where: {
        merchantId: merchant.id, // Critical: Always filter by merchant.id
        isActive: true,
      },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error("Products API error:", error)
    
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authorize request - ensures user is authenticated and has merchant
    const { merchant } = await authorizeRequest()

    const body = await request.json()
    const { name, description, price, stock, images } = body

    if (!name || !price) {
      return NextResponse.json(
        { error: "Name and price are required" },
        { status: 400 }
      )
    }

    // Create product - automatically scoped to merchant.id
    // The merchant.id comes from authorizeRequest(), ensuring tenant isolation
    const product = await prisma.product.create({
      data: {
        merchantId: merchant.id, // Critical: Always set merchant.id
        name,
        description: description || null,
        price: parseFloat(price),
        stock: parseInt(stock) || 0,
        isActive: true,
        images: images
          ? {
              create: images.map((img: { url: string; alt?: string }, idx: number) => ({
                url: img.url,
                alt: img.alt || null,
                sortOrder: idx,
              })),
            }
          : undefined,
      },
      include: {
        images: true,
      },
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error("Product creation error:", error)
    
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    )
  }
}
