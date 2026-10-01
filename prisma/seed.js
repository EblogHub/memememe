import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { universities } from "../shared/universities.js";

const prisma = new PrismaClient();

try {
  for (const university of universities) {
    await prisma.university.upsert({
      where: { shortCode: university.shortCode },
      create: university,
      update: {
        fullName: university.fullName,
        institutionType: university.institutionType,
        state: university.state,
        campusLocations: university.campusLocations
      }
    });
  }
  console.log(`Seeded ${universities.length} universities.`);
} finally {
  await prisma.$disconnect();
}
