/**
 * Smoke test for the vehicles marketplace Prisma schema.
 *
 * Verifies User → Seller → Vehicle → VehicleImage relationships,
 * Wishlist/Inquiry foreign keys, and nested queries.
 *
 * Run: npx ts-node --project tsconfig.scripts.json scripts/test-vehicles-schema.ts
 */
import { PrismaClient } from "@prisma/client";

const TEST_SELLER_EMAIL = "schema-test-seller@carbikekharido.local";
const TEST_BUYER_EMAIL = "schema-test-buyer@carbikekharido.local";
const TEST_SELLER_PHONE = "9999900001";
const TEST_BUYER_PHONE = "9999900002";

const prisma = new PrismaClient();

async function main() {
  console.log("Testing vehicles marketplace schema...\n");

  // -------------------------------------------------------------------------
  // 1. Connect (PrismaClient connects lazily on first query)
  // -------------------------------------------------------------------------
  await prisma.$connect();
  console.log("✓ Connected to database");

  // -------------------------------------------------------------------------
  // 2. Find or create seller test user
  // -------------------------------------------------------------------------
  let sellerUser = await prisma.user.findUnique({
    where: { email: TEST_SELLER_EMAIL },
  });

  if (!sellerUser) {
    sellerUser = await prisma.user.create({
      data: {
        email: TEST_SELLER_EMAIL,
        name: "Schema Test Seller",
        phone: TEST_SELLER_PHONE,
        phoneVerified: true,
      },
    });
    console.log("✓ Created test user");
  } else {
    console.log("✓ Found existing test user");
  }

  // Buyer used for wishlist + inquiry (different user proves cross-user FKs)
  let buyerUser = await prisma.user.findUnique({
    where: { email: TEST_BUYER_EMAIL },
  });

  if (!buyerUser) {
    buyerUser = await prisma.user.create({
      data: {
        email: TEST_BUYER_EMAIL,
        name: "Schema Test Buyer",
        phone: TEST_BUYER_PHONE,
        phoneVerified: true,
      },
    });
    console.log("✓ Created test buyer user");
  } else {
    console.log("✓ Found existing test buyer user");
  }

  // -------------------------------------------------------------------------
  // 3. Create Seller linked to User (1-to-1)
  // -------------------------------------------------------------------------
  let seller = await prisma.seller.findUnique({
    where: { userId: sellerUser.id },
  });

  if (!seller) {
    seller = await prisma.seller.create({
      data: {
        userId: sellerUser.id,
        sellerType: "INDIVIDUAL",
      },
    });
    console.log("✓ Created seller");
  } else {
    console.log("✓ Found existing seller");
  }

  // -------------------------------------------------------------------------
  // 4. Create Vehicle linked to Seller & User
  // -------------------------------------------------------------------------
  const registrationNumber = `TEST-${Date.now().toString(36).toUpperCase()}`;

  const vehicle = await prisma.vehicle.create({
    data: {
      sellerId: seller.id,
      userId: sellerUser.id,
      vehicleType: "CAR",
      brand: "Maruti Suzuki",
      model: "Swift",
      yearOfManufacture: 2022,
      color: "Red",
      condition: "Good",
      registrationNumber,
      fuelType: "petrol",
      transmission: "manual",
      engineCC: 1197,
      askingPrice: BigInt(650000),
      priceNegotiable: true,
      description: "Schema test listing — safe to delete",
      listingType: "NORMAL",
      status: "ACTIVE",
      city: "Lucknow",
      state: "Uttar Pradesh",
      features: JSON.stringify(["ABS", "Airbags", "Power Steering"]),
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  console.log("✓ Created vehicle");

  // -------------------------------------------------------------------------
  // 5. Create VehicleImage linked to Vehicle
  // -------------------------------------------------------------------------
  await prisma.vehicleImage.createMany({
    data: [
      {
        vehicleId: vehicle.id,
        url: "https://stimg.cardekho.com/images/test/swift-front.jpg",
        type: "PHOTO",
        order: 0,
        isThumb: true,
        quality: "hd",
      },
      {
        vehicleId: vehicle.id,
        url: "https://stimg.cardekho.com/images/test/swift-interior.jpg",
        type: "PHOTO",
        order: 1,
        isThumb: false,
      },
    ],
  });
  console.log("✓ Added images");

  // -------------------------------------------------------------------------
  // 6. Create Wishlist entry (buyer saves listing)
  // -------------------------------------------------------------------------
  await prisma.wishlist.create({
    data: {
      userId: buyerUser.id,
      vehicleId: vehicle.id,
    },
  });
  console.log("✓ Created wishlist entry");

  // -------------------------------------------------------------------------
  // 7. Create Inquiry entry (buyer messages seller listing)
  // -------------------------------------------------------------------------
  await prisma.inquiry.create({
    data: {
      vehicleId: vehicle.id,
      buyerId: buyerUser.id,
      message: "Is this vehicle still available? Schema test inquiry.",
      status: "PENDING",
    },
  });
  console.log("✓ Created inquiry entry");

  // -------------------------------------------------------------------------
  // 8. Verify foreign keys — invalid vehicleId must be rejected
  // -------------------------------------------------------------------------
  try {
    await prisma.vehicleImage.create({
      data: {
        vehicleId: "nonexistent_vehicle_id",
        url: "https://example.com/should-fail.jpg",
        type: "PHOTO",
      },
    });
    throw new Error("Expected foreign key violation did not occur");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.includes("Expected foreign key violation") ||
      (!message.includes("Foreign key constraint") &&
        !message.includes("foreign key constraint") &&
        !message.includes("Cannot add or update a child row"))
    ) {
      throw err;
    }
    console.log("✓ Foreign key constraints enforced");
  }

  // -------------------------------------------------------------------------
  // 9. Query vehicle with all relations
  // -------------------------------------------------------------------------
  const loaded = await prisma.vehicle.findUnique({
    where: { id: vehicle.id },
    include: {
      seller: { include: { user: true } },
      user: true,
      images: { orderBy: { order: "asc" } },
      wishlistItems: { include: { user: true } },
      inquiries: { include: { buyer: true } },
    },
  });

  if (!loaded) {
    throw new Error("Vehicle not found after create");
  }

  if (loaded.seller.userId !== sellerUser.id) {
    throw new Error("Seller → User FK mismatch");
  }
  if (loaded.user.id !== sellerUser.id) {
    throw new Error("Vehicle → User FK mismatch");
  }
  if (loaded.images.length < 2) {
    throw new Error(`Expected 2 images, got ${loaded.images.length}`);
  }
  if (loaded.wishlistItems.length !== 1) {
    throw new Error(`Expected 1 wishlist row, got ${loaded.wishlistItems.length}`);
  }
  if (loaded.inquiries.length !== 1) {
    throw new Error(`Expected 1 inquiry, got ${loaded.inquiries.length}`);
  }

  console.log("✓ Queried vehicle with relations");
  console.log(`  • ${loaded.brand} ${loaded.model} (${loaded.registrationNumber})`);
  console.log(`  • Seller: ${loaded.seller.user.name}`);
  console.log(`  • Images: ${loaded.images.length}`);
  console.log(`  • Wishlists: ${loaded.wishlistItems.length}`);
  console.log(`  • Inquiries: ${loaded.inquiries.length}`);

  console.log("\n✓ Schema is working!");
}

main()
  .catch((err) => {
    console.error("\n✗ Schema test failed:");
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    // 10. Disconnect Prisma
    await prisma.$disconnect();
  });
