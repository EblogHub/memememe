import "dotenv/config";
import { prisma } from "./db.js";
import app from "./app.js";

const port = Number(process.env.PORT || 3000);
const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1";
const server = app.listen(port, host, () => console.log(`Acada Cart API listening on ${host}:${port}`));

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
