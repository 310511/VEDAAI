#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -S "${HOME}/.colima/default/docker.sock" ]; then
  export DOCKER_HOST="unix://${HOME}/.colima/default/docker.sock"
fi

start_colima_if_needed() {
  if docker info >/dev/null 2>&1; then
    return 0
  fi
  if command -v colima >/dev/null 2>&1; then
    echo "Starting Colima..."
    colima start
  fi
  if docker info >/dev/null 2>&1; then
    return 0
  fi
  echo "ERROR: Docker is not running. Try: colima start"
  exit 1
}

pull_mongo() {
  echo "Cleaning partial/corrupt MongoDB images..."
  docker compose down 2>/dev/null || true
  docker image rm -f mongo:7 mongo:7.0.14 2>/dev/null || true
  docker builder prune -af >/dev/null 2>&1 || true

  echo "Pulling mongo:7.0.14..."
  if ! docker pull mongo:7.0.14; then
    return 1
  fi
  docker compose up -d mongodb
}

start_colima_if_needed

echo "Starting MongoDB only (Next.js app does not need Redis locally)..."
if ! pull_mongo; then
  echo ""
  echo "Docker pull failed (corrupt layer cache is common on Colima)."
  echo ""
  echo "Try one of these:"
  echo "  1) Hard reset:  ./scripts/colima-reset.sh  then  ./scripts/docker-up.sh"
  echo "  2) Homebrew:    ./scripts/mongo-brew.sh   (no Docker)"
  echo "  3) Atlas cloud:  set MONGODB_URI in frontend/.env.local"
  exit 1
fi

echo ""
echo "MongoDB → mongodb://localhost:27017/vedaai"
