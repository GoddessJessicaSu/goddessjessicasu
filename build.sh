#!/bin/bash
set -e

cd "$(dirname "$0")"

# Load env vars needed for frontend build args
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

REGISTRY="ghcr.io/goddessjessicasu"

echo "==> Building backend..."
docker compose build backend

echo "==> Building frontend..."
docker compose build frontend

echo "==> Pushing images..."
docker push "$REGISTRY/backend:latest"
docker push "$REGISTRY/frontend:latest"

echo "==> Done! Now run ./deploy.sh on the server."
