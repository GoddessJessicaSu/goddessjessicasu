#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "==> Pulling latest code..."
git pull

echo "==> Pulling images..."
docker compose pull backend frontend

echo "==> Restarting services..."
docker compose up -d

echo "==> Cleaning up old images..."
docker image prune -f

echo "==> Done!"
docker compose ps
