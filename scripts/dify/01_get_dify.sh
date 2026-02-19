#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

mkdir -p vendor

if [[ -d vendor/dify/.git ]]; then
  echo "[OK] vendor/dify already exists"
  exit 0
fi

source "$ROOT_DIR/.env" 2>/dev/null || true
TAG="${DIFY_TAG:-latest}"

echo "[INFO] Cloning Dify..."
if [[ "$TAG" == "latest" ]]; then
  if ! command -v jq >/dev/null 2>&1; then
    echo "[ERROR] jq is required. Install jq and retry."
    exit 1
  fi
  TAG="$(curl -s https://api.github.com/repos/langgenius/dify/releases/latest | jq -r .tag_name)"
fi

git clone --depth 1 --branch "$TAG" https://github.com/langgenius/dify.git vendor/dify
echo "[OK] Dify cloned at tag: $TAG"
