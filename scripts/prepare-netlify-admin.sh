#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUBLISH_DIR="$ROOT/netlify-publish"
ADMIN_DIST="$ROOT/apps/admin/dist"

echo "Building admin app..."
pnpm --filter admin build

echo "Preparing Netlify publish folder..."
rm -rf "$PUBLISH_DIR"
mkdir -p "$PUBLISH_DIR/admin"
cp -r "$ADMIN_DIST/"* "$PUBLISH_DIR/admin/"

cat > "$PUBLISH_DIR/netlify.toml" <<'EOF'
# Admin is built with base "/admin/". Publish this folder (not apps/admin/dist).
[[redirects]]
  from = "/"
  to = "/admin/"
  status = 302

# SPA fallback for client-side routes under /admin
[[redirects]]
  from = "/admin/*"
  to = "/admin/index.html"
  status = 200
EOF

echo ""
echo "Netlify publish folder ready: $PUBLISH_DIR"
echo "Deploy the netlify-publish/ folder to Netlify (Site configuration -> Deploys)."
echo "Open: https://<your-site>.netlify.app/admin/"
