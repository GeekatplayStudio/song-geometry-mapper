#!/bin/bash

# Song Geometry Mapper - Setup (Mac/Linux)

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo "==================================================="
echo "Song Geometry Mapper - Setup (Mac/Linux)"
echo "==================================================="

# Check for Docker
if command -v docker >/dev/null 2>&1; then
    if docker info >/dev/null 2>&1; then
        echo "[INFO] Docker detected. Building container..."
        if docker compose build analyzer; then
            echo "[SUCCESS] Docker environment ready."
            echo ""
            echo "Setup complete! You can now use './analyze_song.sh' and './start_web.sh'."
            exit 0
        fi

        echo "[WARN] Docker build failed. Falling back to local Python setup."
    else
        echo "[WARN] Docker is installed but daemon is unavailable."
        echo "[INFO] Falling back to local Python setup."
    fi
fi

# Fallback to Python
echo "[INFO] Checking for Python..."
if ! command -v python3 >/dev/null 2>&1; then
    echo "[ERROR] Python 3 not found. Please install Docker OR Python 3.11+."
    exit 1
fi

echo "[INFO] Setting up local virtual environment..."
cd python || exit
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo "[INFO] Created .venv"
fi

source .venv/bin/activate
echo "[INFO] Installing dependencies..."
python3 -m pip install --upgrade pip
python3 -m pip install -c constraints.txt -r requirements.txt

# Check for Demucs availability
if python3 -c "import demucs" >/dev/null 2>&1; then
    echo "[INFO] Audio separation (Demucs) is available."
else
    echo "[INFO] Note: Audio separation requires 'demucs'. It is included in requirements.txt."
fi

echo "[SUCCESS] Local Python environment ready."
cd ..

echo ""
chmod +x analyze_song.sh start_web.sh
echo "Setup complete! You can now use './analyze_song.sh' and './start_web.sh'."
