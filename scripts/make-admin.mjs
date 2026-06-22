import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

const email = process.argv[2];
if (!email) {
  console.error("Usage: npx tsx scripts/make-admin.mjs <email>");
  process.exit(1);
}

const user = await prisma.user.update({
  where: { email },
  data: { role: "ADMIN" },
  select: { id: true, name: true, email: true, role: true },
});

console.log("✅ Updated:", user);
await prisma.$disconnect();
