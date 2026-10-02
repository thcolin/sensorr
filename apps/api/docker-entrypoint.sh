#!/bin/sh

if [ ! -f /app/.secrets/vapid ]; then
  npx web-push generate-vapid-keys --json > /app/.secrets/vapid
  echo "Generate VAPID keys for web-push feature"
fi

chmod 400 /app/.secrets/vapid
chown node:node /app/.secrets/vapid

if [ ! -f /app/.secrets/updater ]; then
  head -c 32 /dev/urandom | base64 > /app/.secrets/updater
  echo "Generate the secret shared with sensorr-updater"
fi

chmod 400 /app/.secrets/updater
chown node:node /app/.secrets/updater

node /app/dist/apps/api/main.js
