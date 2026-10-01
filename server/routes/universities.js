import { Router } from "express";
import { prisma } from "../db.js";
import { asyncRoute } from "../http.js";

const router = Router();

router.get("/", asyncRoute(async (_req, res) => {
  const universities = await prisma.university.findMany({
    select: { id: true, fullName: true, shortCode: true, state: true, campusLocations: true },
    orderBy: [{ fullName: "asc" }]
  });
  res.set("Cache-Control", "public, max-age=300").json({ universities });
}));

export default router;
