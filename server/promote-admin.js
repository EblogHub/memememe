import "dotenv/config";
import { prisma } from "./db.js";

const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
if (!email) throw new Error("Set ADMIN_BOOTSTRAP_EMAIL before promoting an admin.");

try {
  const user = await prisma.user.update({ where: { email }, data: { role: "ADMIN" }, select: { id: true, email: true } });
  console.log(`Admin access granted to ${user.email} (${user.id}).`);
} finally {
  await prisma.$disconnect();
}
