#!/bin/bash

# Song Geometry Mapper - Setup (Mac/Linux)

echo "==================================================="
echo "Song Geometry Mapper - Setup (Mac/Linux)"
echo "==================================================="

# Check for Docker
if command -v docker >/dev/null 2>&1; then
    echo "[INFO] Docker detected. Building container..."
    docker compose build analyzer
    if [ $? -ne 0 ]; then
        echo "[ERROR] Docker build failed."
        exit 1
    fi
    echo "[SUCCESS] Docker environment ready."
    echo ""
    echo "Setup complete! You can now use './analyze_song.sh' and './start_web.sh'."
    exit 0
fi

# Fallback to Python
echo "[INFO] Docker not found. Checking for Python..."
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
pip install -r requirements.txt

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
