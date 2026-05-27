#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Checking Docker / MongoDB..."
if ! docker info >/dev/null 2>&1; then
  if command -v colima >/dev/null 2>&1; then
    echo "Starting Colima..."
    colima start
    export DOCKER_HOST="unix://${HOME}/.colima/default/docker.sock"
  fi
fi

if ! docker compose ps --status running 2>/dev/null | grep -q mongodb; then
  echo "Starting MongoDB + Redis..."
  docker compose up -d
fi

if [ ! -f frontend/.env.local ]; then
  cp frontend/.env.local.example frontend/.env.local
  echo "Created frontend/.env.local — add your GEMINI_API_KEY"
fi

if [ ! -d frontend/node_modules/next ]; then
  echo "Installing frontend dependencies..."
  (cd frontend && npm install)
fi

echo ""
echo "Starting VedaAI at http://localhost:3000"
echo "Press Ctrl+C to stop"
echo ""
cd frontend && npm run dev
