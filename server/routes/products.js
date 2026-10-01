import { randomUUID } from "node:crypto";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../db.js";
import { asyncRoute, HttpError } from "../http.js";
import { requireUser, requireVerified } from "../security.js";
import { createPrivateObjectUrl, deletePrivateObject, putPrivateObject } from "../storage.js";
import { imageExtension, upload, validateImages } from "../uploads.js";
import { productCategories, productConditions } from "../constants.js";

const router = Router();
const createProductLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false });
router.use(requireUser, requireVerified);

function toPublicProduct(product, imageUrls = []) {
  return {
    id: product.id,
    title: product.title,
    description: product.description,
    price: Number(product.price),
    category: product.category,
    condition: product.condition,
    imageUrls,
    sellerId: product.sellerId,
    sellerName: `${product.seller.firstName} ${product.seller.lastName}`,
    targetUniversityId: product.targetUniversityId,
    campusLocation: product.campusLocation,
    status: product.status,
    createdAt: product.createdAt
  };
}

async function signImages(keys) {
  return Promise.all(keys.map((key) => createPrivateObjectUrl(key, 900)));
}

router.get("/", asyncRoute(async (req, res) => {
  const query = z.object({
    search: z.string().trim().max(100).optional(),
    category: z.enum(productCategories).optional(),
    sort: z.enum(["newest", "price-asc", "price-desc"]).default("newest"),
    cursor: z.string().uuid().optional()
  }).safeParse(req.query);
  if (!query.success) throw new HttpError(400, "Invalid product filters.");

  const { search, category, sort, cursor } = query.data;
  const products = await prisma.product.findMany({
    where: {
      targetUniversityId: req.user.universityId,
      status: "AVAILABLE",
      isSold: false,
      ...(category ? { category } : {}),
      ...(search ? { OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ] } : {}),
      seller: { isVerified: true, accountStatus: "APPROVED", isBanned: false }
    },
    include: { seller: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: sort === "price-asc" ? [{ price: "asc" }, { id: "asc" }] : sort === "price-desc" ? [{ price: "desc" }, { id: "asc" }] : [{ createdAt: "desc" }, { id: "desc" }],
    take: 25,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {})
  });

  const results = await Promise.all(products.map(async (product) => {
    const imageUrls = await signImages(product.imageUrls);
    return toPublicProduct(product, imageUrls);
  }));
  res.set("Cache-Control", "private, no-store").json({ products: results, nextCursor: products.length === 25 ? products.at(-1).id : null });
}));

router.get("/:id", asyncRoute(async (req, res) => {
  const productId = z.string().uuid().safeParse(req.params.id);
  if (!productId.success) throw new HttpError(404, "Product not found.");
  const product = await prisma.product.findFirst({
    where: {
      id: productId.data,
      targetUniversityId: req.user.universityId,
      status: "AVAILABLE",
      isSold: false,
      seller: { isVerified: true, accountStatus: "APPROVED", isBanned: false }
    },
    include: { seller: { select: { id: true, firstName: true, lastName: true, phoneNumber: true } } }
  });
  if (!product) throw new HttpError(404, "Product not found in your campus marketplace.");
  const imageUrls = await signImages(product.imageUrls);
  res.set("Cache-Control", "private, no-store").json({
    product: { ...toPublicProduct(product, imageUrls), targetUniversityShortCode: req.user.university.shortCode },
    sellerPhone: product.seller.phoneNumber,
    safety: {
      payment: "⚠️ SAFETY WARNING: Never transfer money or pay a seller online before meeting face-to-face to inspect and collect the item!",
      meetup: "Arrange handovers in daylight at a busy campus landmark, such as the Main Library Front, a Faculty Lecture Theatre, or the campus bank area."
    }
  });
}));

router.post("/", createProductLimiter, upload.array("images", 3), asyncRoute(async (req, res) => {
  await validateImages(req.files, { minimum: 2, maximum: 3 });
  const parsed = z.object({
    title: z.string().trim().min(2).max(120),
    description: z.string().trim().min(5).max(2000),
    price: z.coerce.number().positive().max(999999999.99),
    category: z.enum(productCategories),
    condition: z.enum(productConditions),
    campusLocation: z.string().trim().min(1).max(160)
  }).safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Check the product details and try again.");
  if (!req.user.university.campusLocations.includes(parsed.data.campusLocation)) {
    throw new HttpError(400, "Choose a pickup point listed for your university.");
  }

  const productId = randomUUID();
  const imageKeys = [];
  try {
    for (const [index, file] of req.files.entries()) {
      const key = `products/${req.user.universityId}/${req.user.id}/${productId}/${index + 1}.${imageExtension(file.mimetype)}`;
      await putPrivateObject(key, file);
      imageKeys.push(key);
    }
    const signedImageUrls = await signImages(imageKeys);
    const product = await prisma.product.create({
      data: {
        id: productId,
        title: parsed.data.title,
        description: parsed.data.description,
        price: parsed.data.price,
        category: parsed.data.category,
        condition: parsed.data.condition,
        imageUrls: imageKeys,
        sellerId: req.user.id,
        targetUniversityId: req.user.universityId,
        campusLocation: parsed.data.campusLocation
      },
      include: { seller: { select: { id: true, firstName: true, lastName: true } } }
    });
    res.status(201).json({ product: toPublicProduct(product, signedImageUrls) });
  } catch (error) {
    await Promise.allSettled(imageKeys.map(deletePrivateObject));
    throw error;
  }
}));

router.patch("/:id/status", asyncRoute(async (req, res) => {
  const productId = z.string().uuid().safeParse(req.params.id);
  const status = z.enum(["AVAILABLE", "SOLD"]).safeParse(req.body.status);
  if (!productId.success || !status.success) throw new HttpError(400, "Invalid product status.");
  const result = await prisma.product.updateMany({
    where: { id: productId.data, sellerId: req.user.id, targetUniversityId: req.user.universityId },
    data: { status: status.data, isSold: status.data === "SOLD" }
  });
  if (result.count !== 1) throw new HttpError(404, "Your product was not found.");
  res.json({ status: status.data });
}));

export default router;
