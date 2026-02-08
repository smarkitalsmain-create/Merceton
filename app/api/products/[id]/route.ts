import { NextRequest, NextResponse } from "next/server"
import { authorizeRequest, ensureTenantAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Example API route demonstrating tenant isolation for resource-specific operations
 * 
 * GET /api/products/[id] - Get specific product (with tenant check)
 * PUT /api/products/[id] - Update product (with tenant check)
 * DELETE /api/products/[id] - Delete product (with tenant check)
 * 
 * Demonstrates how to ensure a resource belongs to the user's merchant
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { merchant } = await authorizeRequest()

    // Get product
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    // CRITICAL: Ensure tenant access - prevents accessing other merchants' products
    // Even if someone tries to access /api/products/other-merchant-product-id
    ensureTenantAccess(product.merchantId, merchant.id)

    return NextResponse.json({ product })
  } catch (error) {
    console.error("Product fetch error:", error)
    
    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Unauthorized: Access denied to this resource" },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { merchant } = await authorizeRequest()

    // Get existing product first
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    // CRITICAL: Ensure tenant access before allowing update
    ensureTenantAccess(existingProduct.merchantId, merchant.id)

    const body = await request.json()
    const { name, description, price, stock, isActive } = body

    // Update product - merchantId cannot be changed (enforced by ensureTenantAccess)
    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: name || existingProduct.name,
        description: description !== undefined ? description : existingProduct.description,
        price: price !== undefined ? parseFloat(price) : existingProduct.price,
        stock: stock !== undefined ? parseInt(stock) : existingProduct.stock,
        isActive: isActive !== undefined ? isActive : existingProduct.isActive,
      },
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error("Product update error:", error)
    
    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Unauthorized: Access denied to this resource" },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { merchant } = await authorizeRequest()

    // Get existing product first
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    // CRITICAL: Ensure tenant access before allowing delete
    ensureTenantAccess(existingProduct.merchantId, merchant.id)

    // Delete product (cascade will handle images)
    await prisma.product.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Product delete error:", error)
    
    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Unauthorized: Access denied to this resource" },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    )
  }
}
