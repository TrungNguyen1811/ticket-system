import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "/",
  build: {
    sourcemap: true,
  },
  css: {
    devSourcemap: true,
  },
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, "ssl/key.pem")),
      cert: fs.readFileSync(path.resolve(__dirname, "ssl/cert.pem")),
    },
    port: 5173,
  },
  optimizeDeps: {
    include: ["react-pdf", "pdfjs-dist"],
  },
});
