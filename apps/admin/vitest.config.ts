import path from "path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const isCI = process.env.CI === "true";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: [
      "node_modules",
      "dist",
      ".idea",
      ".git",
      ".cache",
      "e2e/**/*",
      "**/*.config.{js,ts}",
      "vite.config.test.ts",
      "vitest.config.ts",
    ],
    passWithNoTests: true,
    // Avoid timeouts in CI/slower environments (userEvent, async updates)
    testTimeout: 20000,
    hookTimeout: 15000,
    // CI: threads pool can be faster for pure JS; reporters reduce I/O
    ...(isCI && {
      pool: "threads",
      reporters: ["default"],
    }),
  },
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
});
