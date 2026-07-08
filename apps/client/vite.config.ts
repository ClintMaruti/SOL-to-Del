import path from "path";

import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl()],
  base: "/client/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@sol/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@sol/types": path.resolve(__dirname, "../../packages/types/src"),
      "@sol/api-client": path.resolve(
        __dirname,
        "../../packages/api-client/src"
      ),
      "@sol/i18n": path.resolve(__dirname, "../../packages/i18n/src"),
    },
  },
  server: {
    port: 7376,
    strictPort: true,
    host: process.env.CI ? "localhost" : "chelipeacock.dev.localhost",
  },
  preview: {
    port: 4174,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
