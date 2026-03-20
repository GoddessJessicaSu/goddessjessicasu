#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "==> Pulling latest code..."
git pull

echo "==> Building backend..."
docker compose build backend

echo "==> Building frontend..."
docker compose build frontend

echo "==> Restarting services..."
docker compose up -d --no-build

echo "==> Cleaning up old images..."
docker image prune -f

echo "==> Done!"
docker compose ps
