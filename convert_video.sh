#!/bin/bash

# Song Geometry Mapper - WebM to MP4 Converter (Mac/Linux)

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo "==================================================="
echo "Song Geometry Mapper - WebM to MP4 Converter"
echo "==================================================="

if ! command -v ffmpeg >/dev/null 2>&1; then
    echo "[ERROR] ffmpeg is not installed."
    echo "[INFO] Install (macOS): brew install ffmpeg"
    exit 1
fi

INPUT_FILE="${1:-}"
if [ -z "$INPUT_FILE" ]; then
    echo
    read -r -p "Drag and drop .webm file here and press Enter: " INPUT_FILE
fi

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
    exit 1
fi

if [[ "${INPUT_FILE,,}" != *.webm ]]; then
    echo "[WARN] Input is not .webm; conversion will still be attempted."
fi

INPUT_DIR="$(dirname "$INPUT_FILE")"
INPUT_BASE="$(basename "$INPUT_FILE")"
INPUT_STEM="${INPUT_BASE%.*}"
DEFAULT_OUTPUT="$INPUT_DIR/${INPUT_STEM}.mp4"

echo
read -r -p "Output path [Default: $DEFAULT_OUTPUT]: " OUTPUT_FILE
if [ -z "$OUTPUT_FILE" ]; then
    OUTPUT_FILE="$DEFAULT_OUTPUT"
fi

OUTPUT_FILE="$(printf "%b" "$OUTPUT_FILE" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
OUTPUT_FILE="${OUTPUT_FILE%\"}"
OUTPUT_FILE="${OUTPUT_FILE#\"}"
OUTPUT_FILE="${OUTPUT_FILE%\'}"
OUTPUT_FILE="${OUTPUT_FILE#\'}"

echo
read -r -p "Force 4K output (pad/upscale) for delivery? (y/n) [Default: n]: " FORCE_4K
if [ "$FORCE_4K" != "y" ]; then
    FORCE_4K="n"
fi

echo
if [ "$FORCE_4K" = "y" ]; then
    echo "[INFO] Converting to MP4 (High Quality, 4K output)..."
    ffmpeg -y \
      -i "$INPUT_FILE" \
      -vf "scale=3840:2160:force_original_aspect_ratio=decrease,pad=3840:2160:(ow-iw)/2:(oh-ih)/2:color=black" \
      -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p \
      -c:a aac -b:a 320k \
      -movflags +faststart \
      "$OUTPUT_FILE"
else
    echo "[INFO] Converting to MP4 (High Quality, source resolution)..."
    ffmpeg -y \
      -i "$INPUT_FILE" \
      -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p \
      -c:a aac -b:a 320k \
      -movflags +faststart \
      "$OUTPUT_FILE"
fi

if [ $? -ne 0 ]; then
    echo "[ERROR] Conversion failed."
    exit 1
fi

echo
echo "[SUCCESS] MP4 created: $OUTPUT_FILE"
