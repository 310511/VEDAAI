#!/usr/bin/env bash
# Run MongoDB locally via Homebrew (no Docker).
set -euo pipefail

if ! command -v brew >/dev/null 2>&1; then
  echo "Install Homebrew first: https://brew.sh"
  exit 1
fi

echo "Installing MongoDB Community 7..."
brew tap mongodb/brew 2>/dev/null || true
brew install mongodb-community@7.0

echo "Starting MongoDB service..."
brew services start mongodb-community@7.0

echo ""
echo "MongoDB should be available at: mongodb://localhost:27017/vedaai"
echo "Ensure frontend/.env.local has:"
echo "  MONGODB_URI=mongodb://localhost:27017/vedaai"
echo ""
echo "Restart Next.js: cd frontend && npm run dev"
