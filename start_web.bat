@echo off
setlocal
title Song Geometry Mapper - Web Preview

echo ===================================================
echo Song Geometry Mapper - Web Preview (Windows)
echo ===================================================

echo [Web] Starting web server.
echo.
echo Open: http://localhost:5173

docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Running with Docker...
    docker compose up web
) else (
    echo [INFO] Running with Local Python...
    cd web
    python -m http.server 5173
    cd ..
)

pause
