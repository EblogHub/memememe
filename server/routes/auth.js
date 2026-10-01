import { randomBytes, randomUUID } from "node:crypto";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db.js";
import { asyncRoute, HttpError, publicUser } from "../http.js";
import { requireUser, hashMatricNumber, hashSessionToken, requireSessionSecret, setSessionCookie, sessionCookieName } from "../security.js";
import { deletePrivateObject, putPrivateObject, requireStorage } from "../storage.js";
import { imageExtension, upload, validateImages } from "../uploads.js";

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: "draft-8", legacyHeaders: false });
const emailSchema = z.string().trim().email().max(254);
const phoneSchema = z.string().trim().regex(/^\+[1-9]\d{7,14}$/, "Use an international number such as +2348012345678.");
const matricSchema = z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9/-]+$/);
const sessionLengthMs = 7 * 24 * 60 * 60 * 1000;

function validationError(error) {
  const details = error.issues.map((issue) => issue.message).join(" ");
  return new HttpError(400, details || "Check the submitted student details.");
}

router.post("/register", authLimiter, upload.single("idCard"), asyncRoute(async (req, res) => {
  requireSessionSecret();
  requireStorage();
  await validateImages(req.file ? [req.file] : [], { minimum: 1, maximum: 1 });

  const parsed = z.object({
    firstName: z.string().trim().min(1).max(50),
    lastName: z.string().trim().min(1).max(50),
    email: emailSchema,
    password: z.string().min(12).max(128),
    phoneNumber: phoneSchema,
    matricNumber: matricSchema,
    level: z.coerce.number().int().refine((level) => [100, 200, 300, 400, 500].includes(level), "Choose a level from 100L to 500L."),
    universityId: z.string().uuid(),
    agreedToTerms: z.literal("true")
  }).safeParse(req.body);
  if (!parsed.success) throw validationError(parsed.error);

  const data = { ...parsed.data, email: parsed.data.email.toLowerCase(), matricNumber: parsed.data.matricNumber.trim().toUpperCase() };
  const matricHash = hashMatricNumber(data.matricNumber);
  const [university, blacklisted] = await Promise.all([
    prisma.university.findUnique({ where: { id: data.universityId } }),
    prisma.identityBlacklist.findUnique({ where: { matricHash } })
  ]);
  if (!university) throw new HttpError(400, "Choose a valid university.");
  if (blacklisted) throw new HttpError(403, "This student identity cannot be registered.");

  const objectKey = `student-ids/${randomUUID()}/${randomUUID()}.${imageExtension(req.file.mimetype)}`;
  await putPrivateObject(objectKey, req.file);
  const passwordHash = await bcrypt.hash(data.password, 12);
  const sessionToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionLengthMs);
  let user;

  try {
    user = await prisma.$transaction(async (tx) => {
      if (await tx.identityBlacklist.findUnique({ where: { matricHash } })) {
        throw new HttpError(403, "This student identity cannot be registered.");
      }
      const created = await tx.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          passwordHash,
          phoneNumber: data.phoneNumber,
          matricNumber: data.matricNumber,
          level: data.level,
          idCardPhotoPath: objectKey,
          universityId: data.universityId,
          isVerified: false,
          agreedToTerms: true,
          accountStatus: "PENDING"
        },
        include: { university: true }
      });
      await tx.session.create({ data: { tokenHash: hashSessionToken(sessionToken), userId: created.id, expiresAt } });
      return created;
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    await deletePrivateObject(objectKey).catch(() => {});
    if (error.code === "P2002") throw new HttpError(409, "That email or matriculation number is already registered.");
    throw error;
  }

  setSessionCookie(res, sessionToken);
  res.status(201).json({ user: publicUser(user), next: "/pending-verification" });
}));

router.post("/login", authLimiter, asyncRoute(async (req, res) => {
  const parsed = z.object({ email: emailSchema, password: z.string().min(1).max(128) }).safeParse(req.body);
  if (!parsed.success) throw validationError(parsed.error);
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() }, include: { university: true } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    throw new HttpError(401, "Email or password is incorrect.");
  }
  if (user.isBanned || user.accountStatus === "BANNED") throw new HttpError(403, "This account is no longer available.");

  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({ data: { tokenHash: hashSessionToken(token), userId: user.id, expiresAt: new Date(Date.now() + sessionLengthMs) } });
  setSessionCookie(res, token);
  res.json({ user: publicUser(user), next: user.isVerified && user.accountStatus === "APPROVED" ? "/marketplace" : "/pending-verification" });
}));

router.get("/me", requireUser, (req, res) => {
  res.json({ user: publicUser(req.user), next: req.user.isVerified && req.user.accountStatus === "APPROVED" ? "/marketplace" : "/pending-verification" });
});

router.delete("/me", authLimiter, requireUser, asyncRoute(async (req, res) => {
  const parsed = z.object({ password: z.string().min(1).max(128), confirmation: z.literal("DELETE") }).safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Confirm account deletion and enter your password.");
  if (req.user.role === "ADMIN") throw new HttpError(403, "Admin accounts must be removed by another workspace administrator.");
  if (!(await bcrypt.compare(parsed.data.password, req.user.passwordHash))) throw new HttpError(401, "The password is incorrect.");

  const privateFiles = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${req.user.id}::uuid FOR UPDATE`;
    const products = await tx.product.findMany({ where: { sellerId: req.user.id }, select: { imageUrls: true } });
    await tx.user.delete({ where: { id: req.user.id } });
    return [req.user.idCardPhotoPath, ...products.flatMap((product) => product.imageUrls)];
  });
  await Promise.allSettled(privateFiles.map(deletePrivateObject));
  res.clearCookie(sessionCookieName, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
  res.status(204).end();
}));

router.post("/logout", asyncRoute(async (req, res) => {
  const token = req.cookies?.[sessionCookieName];
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  res.clearCookie(sessionCookieName, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
  res.status(204).end();
}));

export default router;
