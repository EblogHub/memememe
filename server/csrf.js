import { HttpError } from "./http.js";

function allowedOrigins() {
  const values = [
    process.env.APP_ORIGIN || "http://127.0.0.1:5173",
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
    process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  ].filter(Boolean);
  return new Set(values.map((value) => new URL(value).origin));
}

export function requireSameOrigin(req, _res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("origin");
  let requestOrigin;
  try {
    requestOrigin = origin ? new URL(origin).origin : null;
  } catch {
    requestOrigin = null;
  }
  if (!requestOrigin || !allowedOrigins().has(requestOrigin)) {
    return next(new HttpError(403, "Request origin is not allowed."));
  }
  next();
}
