module.exports = {
  // For TypeScript/TSX files in apps, run eslint from the app directory
  'apps/**/*.{ts,tsx}': (filenames) => {
    const apps = new Set();
    filenames.forEach((file) => {
      const match = file.match(/apps\/([^/]+)\//);
      if (match) apps.add(match[1]);
    });
    return Array.from(apps).map(
      (app) => `cd apps/${app} && pnpm exec eslint --fix .`
    );
  },
  // For TypeScript/TSX files in packages, run eslint from the package directory
  'packages/**/*.{ts,tsx}': (filenames) => {
    const packages = new Set();
    filenames.forEach((file) => {
      const match = file.match(/packages\/([^/]+)\//);
      if (match) packages.add(match[1]);
    });
    return Array.from(packages).map(
      (pkg) => `cd packages/${pkg} && pnpm exec eslint --fix .`
    );
  },
  // Format all TypeScript/TSX files with Prettier
  '**/*.{ts,tsx}': ['pnpm exec prettier --write'],
  // Format JSON, CSS, and Markdown files
  '**/*.{json,css,md}': ['pnpm exec prettier --write'],
};
