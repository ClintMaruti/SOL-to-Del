import path from "path";

import tailwindcss from "@tailwindcss/vite";
import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";

const repoRoot = path.resolve(__dirname, "../../..");

const config: StorybookConfig = {
  stories: [
    "../../../packages/ui/src/components/ui/**/*.stories.@(ts|tsx|mdx)",
  ],
  addons: ["@storybook/addon-essentials", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  viteFinal: async (config) =>
    mergeConfig(config, {
      plugins: [tailwindcss()],
      resolve: {
        alias: {
          "@sol/ui/styles": path.resolve(
            repoRoot,
            "packages/ui/src/styles/globals.css"
          ),
          "@sol/ui": path.resolve(repoRoot, "packages/ui/src/index.ts"),
          "@sol/types": path.resolve(repoRoot, "packages/types/src"),
          "@sol/api-client": path.resolve(repoRoot, "packages/api-client/src"),
          "@sol/i18n": path.resolve(repoRoot, "packages/i18n/src/index.ts"),
        },
        dedupe: ["react", "react-dom"],
      },
      server: {
        fs: {
          allow: [
            repoRoot,
            path.resolve(repoRoot, "packages"),
            path.resolve(repoRoot, "apps"),
          ],
        },
      },
    }),
};

export default config;
