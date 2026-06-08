#!/usr/bin/env bash
set -euo pipefail

APP_DIR=~/la-busche
APP_NAME=la-busche

cd "$APP_DIR"

echo "==> Pulling latest changes"
git pull origin main

echo "==> Installing dependencies"
npm ci --omit=dev

echo "==> Building"
npm run build

echo "==> Reloading PM2 process"
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  pm2 reload "$APP_NAME"
else
  pm2 start ecosystem.config.js
fi

echo "==> Saving PM2 process list"
pm2 save

echo "==> Done. Status:"
pm2 show "$APP_NAME"
