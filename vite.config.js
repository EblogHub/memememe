import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  publicDir: process.env.VERCEL ? false : "public",
  build: {
    outDir: process.env.VERCEL ? "public" : "dist",
    emptyOutDir: true
  },
  server: {
    host: "127.0.0.1",
    proxy: {
      "/api": "http://127.0.0.1:3000"
    }
  }
});
