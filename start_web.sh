#!/bin/bash

# Song Geometry Mapper - Web Preview (Mac/Linux)

echo "==================================================="
echo "Song Geometry Mapper - Web Preview (Mac/Linux)"
echo "==================================================="

echo "[Web] Starting web server."
echo ""
echo "Open: http://localhost:5173"

if command -v docker >/dev/null 2>&1; then
    echo "[INFO] Running with Docker..."
    docker compose up web
else
    echo "[INFO] Running with Local Python..."
    cd web || exit
    python3 -m http.server 5173
    cd ..
fi

echo ""
echo "Press Ctrl+C to stop."
