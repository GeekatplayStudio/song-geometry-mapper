#!/bin/bash

# Song Geometry Mapper - Web Preview (Mac/Linux)

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

VOICE_API_HOST="${VOICE_API_HOST:-127.0.0.1}"
VOICE_API_PORT="${VOICE_API_PORT:-5180}"
VOICE_API_PID=""

cleanup() {
    if [ -n "$VOICE_API_PID" ] && kill -0 "$VOICE_API_PID" >/dev/null 2>&1; then
        kill "$VOICE_API_PID" >/dev/null 2>&1 || true
    fi
}

start_voice_api_local() {
    if [ -x "python/.venv/bin/python" ] && [ -f "python/bgm/web_api.py" ]; then
        if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:"$VOICE_API_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
            echo "[INFO] Voice API already listening on http://${VOICE_API_HOST}:${VOICE_API_PORT}"
            return
        fi

        echo "[INFO] Starting Voice Analyzer API on http://${VOICE_API_HOST}:${VOICE_API_PORT} ..."
        (
            cd python || exit 1
            . .venv/bin/activate
            BGM_WEB_API_HOST="$VOICE_API_HOST" BGM_WEB_API_PORT="$VOICE_API_PORT" python -m bgm.web_api
        ) > /tmp/sgm-voice-api.log 2>&1 &
        VOICE_API_PID=$!
        sleep 1
        if kill -0 "$VOICE_API_PID" >/dev/null 2>&1; then
            echo "[INFO] Voice Analyzer API started."
        else
            echo "[WARN] Voice Analyzer API failed to start. Check /tmp/sgm-voice-api.log"
            VOICE_API_PID=""
        fi
    else
        echo "[WARN] Voice Analyzer API unavailable (missing python/.venv). Run ./setup_mac.sh first."
    fi
}

echo "==================================================="
echo "Song Geometry Mapper - Web Preview (Mac/Linux)"
echo "==================================================="

echo "[Web] Starting web server."
echo ""
echo "Open: http://localhost:5173"
echo "Voice API: http://${VOICE_API_HOST}:${VOICE_API_PORT}"

if command -v docker >/dev/null 2>&1; then
    if docker info >/dev/null 2>&1; then
        echo "[INFO] Running with Docker..."
        echo "Press Ctrl+C to stop."
        exec docker compose up web voice-api
    fi

    echo "[WARN] Docker is installed but daemon is unavailable."
    echo "[INFO] Falling back to local Python server."
fi

if ! command -v python3 >/dev/null 2>&1; then
    echo "[ERROR] python3 is required when Docker is unavailable."
    exit 1
fi

trap cleanup EXIT INT TERM
start_voice_api_local

echo "[INFO] Running with Local Python..."
echo "Press Ctrl+C to stop."
cd web || exit 1
python3 -m http.server 5173 --bind 0.0.0.0
