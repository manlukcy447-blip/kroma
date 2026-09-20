#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL is required}"
mkdir -p backups
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
pg_dump --no-owner --no-privileges "$DATABASE_URL" | gzip > "backups/kroma-${STAMP}.sql.gz"
echo "Created backups/kroma-${STAMP}.sql.gz"
