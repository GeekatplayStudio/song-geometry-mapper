#!/bin/bash

# Song Geometry Mapper - Analyzer (Mac/Linux)

echo "==================================================="
echo "Song Geometry Mapper - One-Click Analyzer (Mac/Linux)"
echo "==================================================="

echo "[Analyzer] This script processes an audio file for both full-song and stem analysis."
echo
read -p "Drag and Drop your audio file here and press Enter: " INPUT_FILE

if [ ! -f "$INPUT_FILE" ]; then
    echo "[ERROR] File not found: '$INPUT_FILE'"
    exit 1
fi

echo ""
read -p "Do you want to SEPARATE STEMS (vocals/drums/etc)? (y/n) [Default: n]: " SEP_OPT
if [ "$SEP_OPT" != "y" ]; then
    SEP_OPT="n"
fi

if [ "$SEP_OPT" = "y" ]; then
    echo "Available Stems: vocals, drums, bass, other, all"
    read -p "Enter stem(s) separated by space (e.g. 'vocals drums', 'all') [Default: vocals]: " CHOSEN_STEM
    if [ -z "$CHOSEN_STEM" ]; then
        CHOSEN_STEM="vocals"
    fi
    SEP_FLAGS="--separate $CHOSEN_STEM"
fi

echo ""
echo "[INFO] Analyzing... Please wait. This may take a moment."
echo "Input: $INPUT_FILE"
echo "Separation: $SEP_FLAGS"

if command -v docker >/dev/null 2>&1; then
    echo "[INFO] Running with Docker..."
    docker compose run --rm analyzer \
        --input "$INPUT_FILE" \
        --outdir /workspace/out \
        --sr 48000 \
        --norm none \
        $SEP_FLAGS
else
    echo "[INFO] Running with Local Python..."
    cd python || exit
    source .venv/bin/activate
    python3 -m bgm.analyze \
        --input "$INPUT_FILE" \
        --outdir ../out \
        --sr 48000 \
        --norm none \
        $SEP_FLAGS
    cd ..
fi

echo ""
echo "[SUCCESS] Analysis complete! Check the 'out' folder."
echo "You can now run './start_web.sh' to view the map."
