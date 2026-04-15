import { defineConfig } from "vite";

export default defineConfig({
  // Build assets for sub-path deployment, e.g. /Service%20Card%20Builder/
  base: process.env.VITE_BASE_PATH || "/Service%20Card%20Builder/",
  server: {
    port: 5173,
    open: true
  }
});
