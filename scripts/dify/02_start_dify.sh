#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

DIFY_DIR="$ROOT_DIR/vendor/dify/docker"
if [[ ! -d "$DIFY_DIR" ]]; then
  echo "[ERROR] Dify docker dir not found. Run scripts/dify/01_get_dify.sh first."
  exit 1
fi

cd "$DIFY_DIR"

if [[ ! -f ".env" ]]; then
  cp .env.example .env
fi

echo "[INFO] Starting Dify..."
docker compose up -d
echo "[OK] Dify started (check ports in vendor/dify/docker/docker-compose.yaml)"
