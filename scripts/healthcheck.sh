#!/usr/bin/env bash
set -euo pipefail
URL="${KROMA_HEALTH_URL:-http://localhost:4000/api/health}"
curl --fail --silent --show-error "$URL" | grep -q '"ok":true'
echo "Kroma health check passed"
