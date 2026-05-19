#!/bin/bash
set -e

REPO="https://github.com/CloudCompile/cloudgpt.git"
BRANCH="${GIT_BRANCH:-main}"

echo "==> CloudGPT startup"

# ── Clone or pull ──────────────────────────────────────────────────────────────
if [ -d ".git" ]; then
  echo "==> Pulling latest from $BRANCH..."
  git fetch origin "$BRANCH"
  git reset --hard "origin/$BRANCH"
else
  echo "==> Cloning repository..."
  git clone --branch "$BRANCH" "$REPO" .
fi

# ── Install dependencies ───────────────────────────────────────────────────────
echo "==> Installing dependencies..."
npm install --include=dev

# ── Build Next.js ──────────────────────────────────────────────────────────────
echo "==> Building..."
npm run build

# ── Copy static assets into standalone output ──────────────────────────────────
# Required by Next.js standalone mode
cp -r public .next/standalone/public 2>/dev/null || true
cp -r .next/static .next/standalone/.next/static 2>/dev/null || true

# ── Start ──────────────────────────────────────────────────────────────────────
echo "==> Starting server on port ${PORT:-3000}..."
exec node .next/standalone/server.js
