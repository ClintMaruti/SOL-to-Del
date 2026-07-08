import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import react from "@vitejs/plugin-react";
import { defineConfig, type Connect, type Plugin } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const simDir = path.resolve(__dirname, "../../__sim");

const SIM_MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
};

function serveSimAssets(): Connect.NextHandleFunction {
  return (req, res, next) => {
    const url = req.url?.split("?")[0] ?? "";
    if (!url.startsWith("/__sim")) {
      next();
      return;
    }

    const relativePath = decodeURIComponent(url.slice("/__sim".length) || "/");
    const filePath = path.normalize(path.join(simDir, relativePath));
    if (!filePath.startsWith(simDir)) {
      res.statusCode = 403;
      res.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.statusCode = error.code === "ENOENT" ? 404 : 500;
        res.end(
          error.code === "ENOENT" ? "Not Found" : "Internal Server Error"
        );
        return;
      }

      const ext = path.extname(filePath);
      res.setHeader(
        "Content-Type",
        SIM_MIME_TYPES[ext] ?? "application/octet-stream"
      );
      res.end(data);
    });
  };
}

function simStaticPlugin(): Plugin {
  const attach = (server: { middlewares: Connect.Server }) => {
    server.middlewares.use(serveSimAssets());
  };

  return {
    name: "sim-static",
    configureServer: attach,
    configurePreviewServer: attach,
  };
}

export default defineConfig({
  plugins: [
    //basicSsl(),
    react(),
    tailwindcss(),
    simStaticPlugin(),
    {
      name: "redirect-root-to-admin",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url ?? "";
          // Redirect exact root to /admin/
          if (url === "/" || url === "") {
            res.statusCode = 302;
            res.setHeader("Location", "/admin/");
            res.end();
            return;
          }
          next();
        });
      },
    },
  ],
  base: "/admin/",
  resolve: {
    dedupe: ["react", "react-dom"],
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
    port: 7375,
    strictPort: true,
    host: "localhost",
  },
  preview: {
    port: 4173,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
