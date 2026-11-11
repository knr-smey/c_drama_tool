#!/usr/bin/env bash
# KhmerDubStudio - Next.js + Electron Desktop App Launcher
set -euo pipefail
cd "$(dirname "$0")"

if [ -d ".venv" ]; then
  source .venv/bin/activate
fi

echo "Launching KhmerDubStudio Desktop (Next.js + Electron)..."
npm run app
