import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

const user = await prisma.user.findUnique({
  where: { email: "dilani@example.com" },
  select: { id: true, email: true, name: true, passwordHash: true, phoneVerified: true },
});

console.log("User found:", user ? "YES" : "NO");
if (user) {
  console.log("  email:", user.email);
  console.log("  hasHash:", !!user.passwordHash);
  console.log("  hashPrefix:", user.passwordHash?.slice(0, 7));
  const valid = await bcrypt.compare("Password123", user.passwordHash);
  console.log("  'Password123' valid:", valid);
  console.log("  phoneVerified:", user.phoneVerified);
}

await prisma.$disconnect();
