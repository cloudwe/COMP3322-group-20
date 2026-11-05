#!/usr/bin/env bash
#
# FreshTrack — one-command dev stack launcher
# -------------------------------------------------------------
# Starts the full local stack:
#   1. MySQL 8.4  (Docker container, port 3306)
#   2. Seed data  (admin + buyer accounts, categories, products)
#   3. Backend    (Express, http://localhost:3000)
#   4. Frontend   (Vite,    http://localhost:5173)
#
# Prerequisites (run ONCE on your machine):
#   - Install Docker Desktop:  brew install --cask docker
#     (or download from https://www.docker.com/products/docker-desktop)
#   - Open Docker Desktop and wait until the whale icon is steady / "Docker is running".
#
# Usage:
#   ./start-dev.sh
#
# Notes:
#   - The MySQL container auto-creates the `freshtrack` schema from db/schema.sql
#     on first start. Stopping this script only kills the Node servers; the DB
#     keeps running. Use `docker compose down` to stop/remove the DB container.
#   - `npm run seed` is idempotent (skips if accounts already exist), so it is
#     safe to re-run.
# -------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# --- 0. Pre-flight checks ---------------------------------------------------
echo "==> Checking Docker..."
if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker is not installed."
  echo "       Install it with:  brew install --cask docker"
  echo "       Then open Docker Desktop and wait for it to finish starting."
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo "ERROR: Docker daemon is not running."
  echo "       Open Docker Desktop and wait until it reports 'Docker is running'."
  exit 1
fi

# Pick the compose driver (v2 plugin preferred, v1 binary as fallback)
if docker compose version >/dev/null 2>&1; then
  DC=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  DC=(docker-compose)
else
  echo "ERROR: docker compose is not available (install the compose plugin)."
  exit 1
fi

# --- 1. Start MySQL ---------------------------------------------------------
echo "==> Starting MySQL container (db)..."
"${DC[@]}" up -d db

echo "==> Waiting for MySQL to become ready (up to ~90s)..."
READY=0
for i in $(seq 1 45); do
  if "${DC[@]}" exec -T db mysqladmin --silent ping -uroot -proot >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 2
done
if [ "$READY" -ne 1 ]; then
  echo "ERROR: MySQL did not become ready. Inspect with: ${DC[*]} logs db"
  exit 1
fi
echo "    MySQL is up."

# --- 2. Seed data -----------------------------------------------------------
echo "==> Seeding database (idempotent)..."
( cd backend && npm run seed )

# --- 3. Start backend + frontend -------------------------------------------
mkdir -p logs
echo "==> Starting backend  -> http://localhost:3000  (logs/backend.log)"
( cd backend  && npm run dev ) > logs/backend.log  2>&1 &
BACK_PID=$!

echo "==> Starting frontend -> http://localhost:5173  (logs/frontend.log)"
( cd frontend && npm run dev ) > logs/frontend.log 2>&1 &
FE_PID=$!

cleanup() {
  echo ""
  echo "==> Shutting down dev servers (DB container left running)..."
  kill "$BACK_PID" "$FE_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo ""
echo "=============================================================="
echo " FreshTrack dev stack is LIVE"
echo "   Backend : http://localhost:3000   (api base)"
echo "   Frontend: http://localhost:5173"
echo ""
echo " Demo accounts (created by seed):"
echo "   ADMIN : admin@freshtrack.dev / Admin1234"
echo "   BUYER : buyer@freshtrack.dev  / Buyer1234"
echo ""
echo " Press Ctrl+C to stop the dev servers."
echo "=============================================================="

wait
