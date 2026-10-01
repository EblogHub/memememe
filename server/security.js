import { createHash, createHmac } from "node:crypto";

const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;
export const sessionCookieName = process.env.SESSION_COOKIE_NAME || "acada_session";

export function hashSessionToken(token) {
  requireSessionSecret();
  return createHmac("sha256", process.env.SESSION_SECRET).update(token).digest("hex");
}

export function requireSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    const error = new Error("SESSION_SECRET must be set to at least 32 characters.");
    error.status = 503;
    throw error;
  }
}

export function setSessionCookie(res, token) {
  res.cookie(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionDurationMs
  });
}

export function hashMatricNumber(value) {
  const secret = process.env.IDENTITY_HASH_SECRET;
  if (!secret || secret.length < 32) {
    const error = new Error("IDENTITY_HASH_SECRET must be set to at least 32 characters.");
    error.status = 503;
    throw error;
  }
  return createHash("sha256").update(`${secret}:${value.trim().toUpperCase()}`).digest("hex");
}

export function clearSessionCookie(res) {
  res.clearCookie(sessionCookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });
}

export async function requireUser(req, res, next) {
  try {
    const token = req.cookies?.[sessionCookieName];
    if (!token) return res.status(401).json({ error: "Sign in to continue." });
    const session = await prisma.session.findUnique({
      where: { tokenHash: hashSessionToken(token) },
      include: { user: { include: { university: true } } }
    });
    if (!session || session.expiresAt <= new Date()) {
      if (session) await prisma.session.delete({ where: { id: session.id } });
      clearSessionCookie(res);
      return res.status(401).json({ error: "Your session has expired. Sign in again." });
    }
    if (session.user.isBanned || session.user.accountStatus === "BANNED") {
      await prisma.session.delete({ where: { id: session.id } });
      clearSessionCookie(res);
      return res.status(403).json({ error: "This account is no longer available." });
    }
    req.session = session;
    req.user = session.user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireVerified(req, res, next) {
  if (!req.user?.isVerified || req.user.accountStatus !== "APPROVED") {
    return res.status(403).json({ error: "A verified student account is required." });
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ error: "Admin access required." });
  next();
}
