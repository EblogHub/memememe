import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { asyncRoute, HttpError } from "../http.js";
import { hashMatricNumber, requireAdmin, requireUser } from "../security.js";
import { createPrivateObjectUrl, deletePrivateObject } from "../storage.js";

const router = Router();
router.use(requireUser, requireAdmin);

router.get("/verifications", asyncRoute(async (_req, res) => {
  const applicants = await prisma.user.findMany({
    where: { isVerified: false, accountStatus: { in: ["PENDING", "REJECTED"] }, isBanned: false },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      matricNumber: true,
      level: true,
      idCardPhotoPath: true,
      createdAt: true,
      university: { select: { fullName: true, shortCode: true } }
    },
    orderBy: { createdAt: "asc" }
  });
  const queue = await Promise.all(applicants.map(async (applicant) => ({
    id: applicant.id,
    fullName: `${applicant.firstName} ${applicant.lastName}`,
    email: applicant.email,
    phoneNumber: applicant.phoneNumber,
    matricNumber: applicant.matricNumber,
    level: applicant.level,
    accountStatus: applicant.accountStatus,
    university: applicant.university,
    createdAt: applicant.createdAt,
    idCardUrl: await createPrivateObjectUrl(applicant.idCardPhotoPath, 300)
  })));
  res.set("Cache-Control", "private, no-store").json({ applicants: queue });
}));

router.post("/verifications/:userId", asyncRoute(async (req, res) => {
  const userId = z.string().uuid().safeParse(req.params.userId);
  const status = z.enum(["APPROVED", "REJECTED"]).safeParse(req.body.status);
  if (!userId.success || !status.success) throw new HttpError(400, "Choose approve or reject for a valid student.");

  const result = await prisma.$transaction(async (tx) => {
    const student = await tx.user.findUnique({ where: { id: userId.data }, select: { id: true, idCardPhotoPath: true, isBanned: true } });
    if (!student || student.isBanned) throw new HttpError(404, "Student application not found.");
    if (status.data === "APPROVED" && !student.idCardPhotoPath) throw new HttpError(400, "This student has no ID card on file.");
    const updated = await tx.user.update({
      where: { id: student.id },
      data: { isVerified: status.data === "APPROVED", accountStatus: status.data }
    });
    await tx.adminAuditEvent.create({
      data: { adminId: req.user.id, action: status.data === "APPROVED" ? "STUDENT_APPROVED" : "STUDENT_REJECTED", targetId: student.id }
    });
    return updated;
  });
  res.json({ id: result.id, isVerified: result.isVerified, accountStatus: result.accountStatus });
}));

router.post("/ban-user", asyncRoute(async (req, res) => {
  const parsed = z.object({
    userId: z.string().uuid().optional(),
    matricNumber: z.string().trim().min(2).max(40).optional(),
    reason: z.string().trim().min(3).max(240).default("Trust and safety review")
  }).refine((body) => body.userId || body.matricNumber, { message: "Provide a user ID or matriculation number." }).safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Provide a valid user ID or matriculation number.");

  const request = parsed.data;
  let target = request.userId
    ? await prisma.user.findUnique({ where: { id: request.userId } })
    : await prisma.user.findUnique({ where: { matricNumber: request.matricNumber.toUpperCase() } });
  if (!target && !request.matricNumber) throw new HttpError(404, "Student account not found.");
  const matricNumber = request.matricNumber || target.matricNumber;
  const matricHash = hashMatricNumber(matricNumber);

  const removedProducts = await prisma.$transaction(async (tx) => {
    const existing = target ? await tx.user.findUnique({ where: { id: target.id }, select: { id: true, matricNumber: true } }) : null;
    const normalizedMatric = (existing?.matricNumber || matricNumber).toUpperCase();
    const identityHash = hashMatricNumber(normalizedMatric);
    if (existing) {
      await tx.user.update({ where: { id: existing.id }, data: { isBanned: true, isVerified: false, accountStatus: "BANNED" } });
      await tx.session.deleteMany({ where: { userId: existing.id } });
    }
    const activeProductFilter = { sellerId: existing?.id, status: "AVAILABLE", isSold: false };
    const products = existing ? await tx.product.findMany({ where: activeProductFilter, select: { id: true, imageUrls: true } }) : [];
    if (existing) await tx.product.deleteMany({ where: activeProductFilter });
    await tx.identityBlacklist.upsert({
      where: { matricHash: identityHash },
      create: { matricHash: identityHash, userId: existing?.id || null, reason: request.reason },
      update: { userId: existing?.id || null, reason: request.reason }
    });
    await tx.adminAuditEvent.create({
      data: {
        adminId: req.user.id,
        action: "USER_BANNED",
        targetId: existing?.id || null,
        details: { reason: request.reason, matricHash: identityHash, productsDeleted: products.length }
      }
    });
    return products;
  });

  const imageKeys = removedProducts.flatMap((product) => product.imageUrls);
  await Promise.allSettled(imageKeys.map(deletePrivateObject));
  res.json({ banned: true, productsDeleted: removedProducts.length, identityBlacklisted: true });
}));

export default router;
