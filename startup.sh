#!/bin/bash

echo "=========================================="
echo "  Song Geometry Mapper - Startup Script"
echo "=========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "[ERROR] Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "[INFO] Docker is running."

# Build/Update images
echo "[INFO] Building/Updating Docker images..."
docker compose build analyzer

# Start the web service
echo "[INFO] Starting Web Server..."
echo "[INFO] The application will be available at http://localhost:5173"
echo "[INFO] Press Ctrl+C to stop."

# Open Browser (works on macOS)
sleep 5
open "http://localhost:5173" &

# Run
docker compose up web
