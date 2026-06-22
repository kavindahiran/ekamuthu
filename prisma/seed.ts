/**
 * Seed script — populates the database with realistic test data.
 * Run with: npx prisma db seed
 *
 * Safe to run multiple times — uses upsert so it won't duplicate records.
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🌱 Seeding database...");

  // ── 1. Create a verified host user ────────────────────────────────────────
  // This user can host dinners. Password is "Password123" for testing.
  const passwordHash = await bcrypt.hash("Password123", 12);

  const host = await prisma.user.upsert({
    where: { email: "dilani@example.com" },
    update: {},
    create: {
      email: "dilani@example.com",
      name: "Dilani Perera",
      displayName: "Dilani P.",
      passwordHash,
      phone: "+94771234567",
      phoneVerified: true,
      idVerificationStatus: "VERIFIED",
      isHostEligible: true,
      hostSince: new Date("2026-01-01"),
      bio: "Home chef and food lover from Colombo. I love sharing authentic Sri Lankan flavours with new friends around my dining table.",
      avgRatingAsHost: 4.9,
      totalReviewsAsHost: 23,
    },
  });

  console.log(`✓ Host user: ${host.email}`);

  // ── 2. Create dinner listings ─────────────────────────────────────────────
  // Each listing has a specific date, location, dietary tags, and price.
  // "seatsAvailable" starts equal to "totalSeats" (nobody booked yet).

  const dinners = [
    {
      title: "A Taste of Jaffna — Home Style Cooking",
      description:
        "Experience authentic Northern Sri Lankan cuisine in an intimate setting. We'll be serving traditional Jaffna crab curry, mutton rolls, and pittu with coconut milk. All meat is halal. My family has been cooking these recipes for three generations.",
      cuisineType: "SRI_LANKAN" as const,
      menuItems: ["Jaffna Crab Curry", "Mutton Rolls", "Pittu & Coconut Milk", "Wattalappam"],
      dietaryTags: ["HALAL", "NO_BEEF"] as any,
      totalSeats: 5,
      seatsAvailable: 5,
      pricePerSeatLKR: 1500,
      dinnerDate: new Date("2026-07-05T19:00:00"),
      doorOpenTime: new Date("2026-07-05T18:30:00"),
      endTime: new Date("2026-07-05T22:00:00"),
      area: "Jaffna City",
      city: "Jaffna",
      dietaryNotes: "All meat is halal-certified. No beef served.",
    },
    {
      title: "Rice & Curry Evening in Colombo 3",
      description:
        "A proper Sri Lankan rice and curry spread — the kind your grandmother used to make. Eight curries, three sambols, papadam, and pol roti. Come hungry. This is a no-rush, no-beef household.",
      cuisineType: "SRI_LANKAN" as const,
      menuItems: ["Red Rice", "Dhal Curry", "Jackfruit Curry", "Beetroot Curry", "Fish Ambul Thiyal", "Pol Sambol", "Seeni Sambol", "Papadam"],
      dietaryTags: ["NO_BEEF"] as any,
      totalSeats: 4,
      seatsAvailable: 4,
      pricePerSeatLKR: 2500,
      dinnerDate: new Date("2026-07-08T19:30:00"),
      doorOpenTime: new Date("2026-07-08T19:00:00"),
      endTime: new Date("2026-07-08T22:30:00"),
      area: "Colombo 3",
      city: "Colombo",
      dietaryNotes: "No beef in any dish. Fish and chicken served.",
    },
    {
      title: "South Indian Vegetarian Thali Night",
      description:
        "A strictly vegetarian South Indian feast — rasam, sambar, three curries, rice, appam, and homemade payasam. Perfect for Buddhist and Hindu guests who are tired of compromising on strictness when eating out.",
      cuisineType: "SOUTH_INDIAN" as const,
      menuItems: ["Rasam", "Sambar", "Avial", "Kootu", "Plain Rice", "Appam", "Payasam"],
      dietaryTags: ["STRICT_BUDDHIST_VEG", "HINDU_VEG", "LACTO_VEGETARIAN"] as any,
      totalSeats: 5,
      seatsAvailable: 3,
      pricePerSeatLKR: 1800,
      dinnerDate: new Date("2026-07-12T18:30:00"),
      doorOpenTime: new Date("2026-07-12T18:00:00"),
      endTime: new Date("2026-07-12T21:30:00"),
      area: "Kandy City",
      city: "Kandy",
      dietaryNotes: "Strictly no meat, fish, or eggs. No onion or garlic.",
    },
    {
      title: "Lamprais & Dutch Bredie Dinner",
      description:
        "A colonial-era Sri Lankan classic that takes two days to prepare. Lamprais (rice baked in banana leaf with four curries, frikkadels, and blachan), followed by a Dutch-inspired bredie stew. A rare experience — very few home cooks still make this.",
      cuisineType: "SRI_LANKAN" as const,
      menuItems: ["Lamprais", "Frikkadels", "Seeni Sambol", "Blachan", "Dutch Bredie", "Bread Pudding"],
      dietaryTags: ["REGULAR_NON_VEG"] as any,
      totalSeats: 4,
      seatsAvailable: 2,
      pricePerSeatLKR: 3500,
      dinnerDate: new Date("2026-07-15T19:00:00"),
      doorOpenTime: new Date("2026-07-15T18:30:00"),
      endTime: new Date("2026-07-15T22:30:00"),
      area: "Colombo 7",
      city: "Colombo",
      dietaryNotes: "Contains beef, pork, and chicken. Not suitable for dietary restrictions.",
    },
    {
      title: "Coastal Galle Seafood Evening",
      description:
        "Fresh catch straight from Galle harbour, cooked simply with coconut, goraka, and green chillies. No heavy spices — just clean, coastal flavours. We sit on the veranda overlooking the fort walls.",
      cuisineType: "SRI_LANKAN" as const,
      menuItems: ["Fish Curry (goraka)", "Prawn Devilled", "Squid Curry", "Coconut Sambol", "String Hoppers", "Coconut Crème Brûlée"],
      dietaryTags: ["NO_BEEF", "NO_PORK"] as any,
      totalSeats: 5,
      seatsAvailable: 4,
      pricePerSeatLKR: 2800,
      dinnerDate: new Date("2026-07-20T18:30:00"),
      doorOpenTime: new Date("2026-07-20T18:00:00"),
      endTime: new Date("2026-07-20T21:30:00"),
      area: "Galle Fort",
      city: "Galle",
      dietaryNotes: "Seafood only — no beef or pork. Muslim guests welcome.",
    },
  ];

  for (const dinner of dinners) {
    await prisma.dinnerListing.create({
      data: {
        ...dinner,
        hostId: host.id,
        status: "ACTIVE",
      },
    });
    console.log(`✓ Dinner: "${dinner.title}" in ${dinner.city}`);
  }

  console.log("\n✅ Seed complete. 1 host + 5 dinners created.");
  console.log("   Host login → dilani@example.com / Password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
