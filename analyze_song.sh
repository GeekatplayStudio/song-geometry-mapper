#!/bin/bash

# Song Geometry Mapper - Analyzer (Mac/Linux)

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo "==================================================="
echo "Song Geometry Mapper - One-Click Analyzer (Mac/Linux)"
echo "==================================================="

echo "[Analyzer] This script processes an audio file for both full-song and stem analysis."
echo
read -r -p "Drag and Drop your audio file here and press Enter: " INPUT_FILE

INPUT_FILE="$(printf "%b" "$INPUT_FILE" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
INPUT_FILE="${INPUT_FILE%\"}"
INPUT_FILE="${INPUT_FILE#\"}"
INPUT_FILE="${INPUT_FILE%\'}"
INPUT_FILE="${INPUT_FILE#\'}"
if [[ "$INPUT_FILE" == "~/"* ]]; then
    INPUT_FILE="$HOME/${INPUT_FILE#~/}"
fi

if [ ! -f "$INPUT_FILE" ]; then
    echo "[ERROR] File not found: '$INPUT_FILE'"
    echo "[INFO] Tip: Drag the file directly into this terminal so the full path is inserted."
    exit 1
fi

SEP_ARGS=()
echo ""
read -r -p "Do you want to SEPARATE STEMS (vocals/drums/etc)? (y/n) [Default: n]: " SEP_OPT
if [ "$SEP_OPT" != "y" ]; then
    SEP_OPT="n"
fi

if [ "$SEP_OPT" = "y" ]; then
    echo "Available Stems: vocals, drums, bass, other, all"
    read -r -p "Enter stem(s) separated by space (e.g. 'vocals drums', 'all') [Default: vocals]: " CHOSEN_STEM
    if [ -z "$CHOSEN_STEM" ]; then
        CHOSEN_STEM="vocals"
    fi
    read -r -a STEM_TARGETS <<< "$CHOSEN_STEM"
    SEP_ARGS=(--separate "${STEM_TARGETS[@]}")
fi

echo ""
echo "[INFO] Analyzing... Please wait. This may take a moment."
echo "Input: $INPUT_FILE"
if [ ${#SEP_ARGS[@]} -gt 0 ]; then
    echo "Separation: ${SEP_ARGS[*]}"
else
    echo "Separation: none"
fi

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    echo "[INFO] Running with Docker..."
    docker compose run --rm analyzer \
        --input "$INPUT_FILE" \
        --outdir /workspace/out \
        --sr 48000 \
        --norm none \
        "${SEP_ARGS[@]}"
else
    if command -v docker >/dev/null 2>&1; then
        echo "[WARN] Docker is installed but daemon is unavailable."
        echo "[INFO] Falling back to local Python analyzer."
    fi
    echo "[INFO] Running with Local Python..."
    cd python || exit
    source .venv/bin/activate
    python3 -m bgm.analyze \
        --input "$INPUT_FILE" \
        --outdir ../out \
        --sr 48000 \
        --norm none \
        "${SEP_ARGS[@]}"
    cd ..
fi

echo ""
echo "[SUCCESS] Analysis complete! Check the 'out' folder."
echo "Voice analyzer JSON is at: out/features.json"
echo "You can now run './start_web.sh' and use Voice mode with a single audio upload."
