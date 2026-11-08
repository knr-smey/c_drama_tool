#!/usr/bin/env bash
# KhmerDubStudio - macOS / Linux desktop launcher
set -euo pipefail
cd "$(dirname "$0")"

PYTHON_BIN="${PYTHON_BIN:-python3}"

if ! "$PYTHON_BIN" --version >/dev/null 2>&1; then
  echo "[ERROR] Python 3 is not installed. Install it from https://www.python.org/downloads/"
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "[WARN] ffmpeg was not found on PATH."
  if [ "$(uname -s)" = "Darwin" ]; then
    echo "       Install it with: brew install ffmpeg"
  else
    echo "       Install it with: sudo apt install ffmpeg"
  fi
  echo "       (The bundled imageio-ffmpeg fallback may still work.)"
fi

if [ ! -d ".venv" ]; then
  echo "[1/3] Creating virtual environment (.venv)..."
  "$PYTHON_BIN" -m venv .venv
fi

# shellcheck disable=SC1091
source .venv/bin/activate

echo "[2/3] Installing dependencies..."
python -m pip install --upgrade pip >/dev/null
python -m pip install -r requirements-desktop.txt

echo "[3/3] Launching KhmerDubStudio..."
exec python app.py
