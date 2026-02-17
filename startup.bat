@echo off
echo ==========================================
echo   Song Geometry Mapper - Startup Script
echo ==========================================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [INFO] Docker is running.

REM Build the analyzer image if needed (or force build to be safe)
echo [INFO] Building/Updating Docker images...
docker compose build analyzer

REM Start the web service
echo [INFO] Starting Web Server...
echo [INFO] The application will be available at http://localhost:5173
echo [INFO] Press Ctrl+C in this window to stop the server.

REM Open Browser
timeout /t 5
start "" "http://localhost:5173"

REM Run the web service
docker compose up web
