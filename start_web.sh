#!/bin/bash

# Song Geometry Mapper - Web Preview (Mac/Linux)

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo "==================================================="
echo "Song Geometry Mapper - Web Preview (Mac/Linux)"
echo "==================================================="

echo "[Web] Starting web server."
echo ""
echo "Open: http://localhost:5173"

if command -v docker >/dev/null 2>&1; then
    if docker info >/dev/null 2>&1; then
        echo "[INFO] Running with Docker..."
        echo "Press Ctrl+C to stop."
        exec docker compose up web
    fi

    echo "[WARN] Docker is installed but daemon is unavailable."
    echo "[INFO] Falling back to local Python server."
fi

if ! command -v python3 >/dev/null 2>&1; then
    echo "[ERROR] python3 is required when Docker is unavailable."
    exit 1
fi

echo "[INFO] Running with Local Python..."
echo "Press Ctrl+C to stop."
cd web || exit 1
exec python3 -m http.server 5173 --bind 0.0.0.0
