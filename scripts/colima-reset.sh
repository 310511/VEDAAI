#!/usr/bin/env bash
# Fixes Colima/Docker "input/output error" or corrupted image blobs.
set -euo pipefail

echo "This will stop Colima, delete its VM, and create a fresh one."
echo "All local Docker images/containers in Colima will be removed."
printf "Continue? [y/N] "
read -r ans

case "$(printf '%s' "$ans" | tr '[:upper:]' '[:lower:]')" in
  y|yes) ;;
  *) echo "Cancelled."; exit 0 ;;
esac

colima stop 2>/dev/null || true
colima delete -f 2>/dev/null || true
colima start --cpu 2 --memory 4

export DOCKER_HOST="unix://${HOME}/.colima/default/docker.sock"
docker info >/dev/null

echo "Colima reset complete. Run: ./scripts/docker-up.sh"
