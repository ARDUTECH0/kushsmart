#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Deploy the KUSH SMART website.
# Builds the Next.js site and uploads it to the server. Run it after you edit
# anything in this folder:
#
#     ./deploy.sh          (Git Bash / macOS / Linux)
#
# On Windows: right-click this file → "Git Bash Here" isn't needed — just open
# Git Bash in this folder and run  bash deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Settings (override with env vars if ever needed) ─────────────────────────
SERVER="${KUSH_SERVER:-root@187.127.229.50}"
WEB_DIR="${KUSH_WEB_DIR:-/opt/kushsmart-web/out}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
KEY="${KUSH_SSH_KEY:-$REPO_ROOT/.deploy/kush_setup_key}"

SSH_OPTS=(-o StrictHostKeyChecking=no)
[ -f "$KEY" ] && SSH_OPTS+=(-i "$KEY")

cd "$SCRIPT_DIR"

echo "▶ Building the website…"
npx next build

echo "▶ Uploading to $SERVER:$WEB_DIR …"
tar -czf - -C out . | ssh "${SSH_OPTS[@]}" "$SERVER" \
  "rm -rf '$WEB_DIR' && mkdir -p '$WEB_DIR' && tar -xzf - -C '$WEB_DIR'"

echo "✅ Website deployed → https://kushsmart.space"
