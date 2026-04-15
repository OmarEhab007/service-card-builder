import { defineConfig } from "vite";

export default defineConfig({
  // Build assets for sub-path deployment, e.g. /service-card-builder/
  base: process.env.VITE_BASE_PATH || "/service-card-builder/",
  server: {
    port: 5173,
    open: true
  }
});
