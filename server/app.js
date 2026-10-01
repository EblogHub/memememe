import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "./db.js";
import { requireSameOrigin } from "./csrf.js";
import { asyncRoute } from "./http.js";
import { isStorageReady } from "./storage.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import productRoutes from "./routes/products.js";
import universityRoutes from "./routes/universities.js";

const app = express();
const appOrigin = process.env.APP_ORIGIN || "http://127.0.0.1:5173";
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const servesLocalBuild = process.env.NODE_ENV === "production" && process.env.VERCEL !== "1";

if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", appOrigin],
      formAction: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));
app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());
app.use(requireSameOrigin);
app.use("/api", rateLimit({ windowMs: 60 * 1000, limit: 180, standardHeaders: "draft-8", legacyHeaders: false }));

app.get("/api/health", asyncRoute(async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true, database: "connected", privateStorageConfigured: isStorageReady() });
}));
app.use("/api/auth", authRoutes);
app.use("/api/universities", universityRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);

if (servesLocalBuild) {
  const clientBuild = path.join(projectRoot, "dist");
  app.use(express.static(clientBuild, { index: false, maxAge: "1h" }));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(clientBuild, "index.html"));
  });
}

app.use((req, res) => res.status(404).json({ error: "Not found." }));
app.use((error, _req, res, _next) => {
  const databaseUnavailable = error.name === "PrismaClientInitializationError" || error.code === "P1001";
  const status = Number.isInteger(error.status) ? error.status : error.name === "MulterError" ? 400 : databaseUnavailable ? 503 : 500;
  if (status >= 500) console.error(error);
  const message = databaseUnavailable
    ? "Campus services are offline because the database is not connected."
    : status === 500 ? "Something went wrong. Try again." : error.message;
  res.status(status).json({ error: message });
});

export default app;
