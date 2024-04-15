#!/bin/sh

if [ ! -f /app/.secrets/vapid ]; then
  npx web-push generate-vapid-keys --json > /app/.secrets/vapid
  echo "Generate VAPID keys for web-push feature"
fi

chmod 400 /app/.secrets/vapid
chown node:node /app/.secrets/vapid

node /app/dist/apps/api/main.js
