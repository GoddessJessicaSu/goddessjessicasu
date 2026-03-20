#!/bin/bash
set -euo pipefail

# --- Config ---
DB_PATH="/opt/goddess-os/data/prod.db"
BACKUP_DIR="/opt/goddess-os/backups"
STORJ_BUCKET="s3://goddess-db-backups"
STORJ_ENDPOINT="https://gateway.storjshare.io"
KEEP_LOCAL_DAYS=7

# --- Run ---
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="prod_${TIMESTAMP}.db"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

mkdir -p "$BACKUP_DIR"

# Safe online backup (handles WAL/locking correctly)
sqlite3 "$DB_PATH" ".backup '${BACKUP_PATH}'"

# Compress before upload
gzip "$BACKUP_PATH"
BACKUP_PATH="${BACKUP_PATH}.gz"
BACKUP_FILE="${BACKUP_FILE}.gz"

# Upload to Storj via S3-compatible gateway
aws s3 cp "$BACKUP_PATH" "${STORJ_BUCKET}/${BACKUP_FILE}" \
  --endpoint-url "$STORJ_ENDPOINT"

echo "$(date -Iseconds) Backed up ${BACKUP_FILE} ($(du -h "$BACKUP_PATH" | cut -f1))"

# Clean up old local backups
find "$BACKUP_DIR" -name "prod_*.db.gz" -mtime +"$KEEP_LOCAL_DAYS" -delete
