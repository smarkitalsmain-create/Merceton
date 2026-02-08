import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // ============================================================================
  // 1. Create Merchant
  // ============================================================================
  const merchant = await prisma.merchant.upsert({
    where: { slug: "demo-store" },
    update: {},
    create: {
      slug: "demo-store",
      displayName: "Demo Store",
      isActive: true,
      // Using platform defaults (null = use defaults)
      feePercentageBps: null, // Will use 200 bps (2%)
      feeFlatPaise: null,     // Will use 500 paise (₹5)
      feeMaxCapPaise: null,   // Will use 2500 paise (₹25)
    },
  })

  console.log("✅ Created merchant:", merchant.displayName)

  // ============================================================================
  // 2. Create Storefront Settings
  // ============================================================================
  const storefront = await prisma.storefrontSettings.upsert({
    where: { merchantId: merchant.id },
    update: {},
    create: {
      merchantId: merchant.id,
      logoUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=200",
      theme: "minimal",
    },
  })

  console.log("✅ Created storefront settings")

  // ============================================================================
  // 3. Create Merchant Admin User
  // ============================================================================
  const user = await prisma.user.upsert({
    where: { authUserId: "demo_user_123" },
    update: {},
    create: {
      merchantId: merchant.id,
      authUserId: "demo_user_123", // In real app, this would be from Clerk
      email: "admin@demo-store.com",
      name: "Demo Admin",
      role: "ADMIN",
      isActive: true,
    },
  })

  console.log("✅ Created admin user:", user.email)

  // ============================================================================
  // 4. Create Products with Images
  // ============================================================================
  const products = [
    {
      name: "Premium Cotton T-Shirt",
      description: "100% Organic Cotton, Comfortable fit, Available in multiple colors",
      price: 599.00,
      stock: 50,
      images: [
        {
          url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
          alt: "Premium Cotton T-Shirt Front",
          sortOrder: 0,
        },
        {
          url: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800",
          alt: "Premium Cotton T-Shirt Back",
          sortOrder: 1,
        },
      ],
    },
    {
      name: "Wireless Noise Cancelling Headphones",
      description: "Premium noise cancelling technology, 20hr battery life, Bluetooth 5.0",
      price: 2999.00,
      stock: 30,
      images: [
        {
          url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
          alt: "Wireless Headphones",
          sortOrder: 0,
        },
      ],
    },
    {
      name: "Genuine Leather Wallet",
      description: "Handcrafted genuine leather, RFID blocking technology, Multiple card slots",
      price: 1299.00,
      stock: 25,
      images: [
        {
          url: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800",
          alt: "Leather Wallet",
          sortOrder: 0,
        },
      ],
    },
    {
      name: "Ceramic Coffee Mug Set",
      description: "Set of 2 ceramic mugs, 350ml capacity each, Dishwasher safe",
      price: 299.00,
      stock: 100,
      images: [
        {
          url: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800",
          alt: "Coffee Mug Set",
          sortOrder: 0,
        },
      ],
    },
    {
      name: "Smart Fitness Watch",
      description: "Heart rate monitor, Step counter, Sleep tracking, Water resistant",
      price: 4999.00,
      stock: 20,
      images: [
        {
          url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
          alt: "Smart Fitness Watch",
          sortOrder: 0,
        },
        {
          url: "https://images.unsplash.com/photo-1544117519-31a4b719223d?w=800",
          alt: "Smart Fitness Watch Side View",
          sortOrder: 1,
        },
      ],
    },
    {
      name: "Minimalist Backpack",
      description: "Waterproof material, Laptop compartment, Multiple pockets, Ergonomic design",
      price: 2499.00,
      stock: 40,
      images: [
        {
          url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
          alt: "Minimalist Backpack",
          sortOrder: 0,
        },
        {
          url: "https://images.unsplash.com/photo-1564422167501-08d4e7730e48?w=800",
          alt: "Backpack Interior",
          sortOrder: 1,
        },
      ],
    },
  ]

  for (const productData of products) {
    const { images, ...productFields } = productData

    const product = await prisma.product.create({
      data: {
        ...productFields,
        merchantId: merchant.id,
        isActive: true,
        images: {
          create: images,
        },
      },
      include: {
        images: true,
      },
    })

    console.log(`✅ Created product: ${product.name} (${product.images.length} images)`)
  }

  console.log("🎉 Seeding completed!")
  console.log("\n📊 Summary:")
  console.log(`   - 1 Merchant: ${merchant.displayName} (${merchant.slug})`)
  console.log(`   - 1 Admin User: ${user.email}`)
  console.log(`   - 6 Products with images`)
  console.log(`\n🌐 Access storefront at: /store/${merchant.slug}`)
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
