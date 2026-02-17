@echo off
setlocal
title Song Geometry Mapper - Web Preview

echo ===================================================
echo Song Geometry Mapper - Web Preview (Windows)
echo ===================================================

echo [Web] Starting web server.
echo.
echo Open: http://localhost:5173
echo Voice API: http://127.0.0.1:5180

docker --version >nul 2>&1
if %errorlevel% equ 0 (
    docker info >nul 2>&1
    if %errorlevel% neq 0 (
        echo [WARN] Docker is installed but daemon is unavailable.
        goto :local_python
    )
    echo [INFO] Running with Docker...
    docker compose up web voice-api
    goto :end
)

:local_python
echo [INFO] Running with Local Python...
if exist python\.venv\Scripts\python.exe (
    echo [INFO] Starting Voice Analyzer API in a new window...
    start "SGM Voice API" cmd /k "cd /d %~dp0python && call .venv\Scripts\activate.bat && python -m bgm.web_api --host 127.0.0.1 --port 5180"
) else (
    echo [WARN] Voice Analyzer API unavailable. Run setup_windows.bat first.
)
cd web
python -m http.server 5173
cd ..

:end
pause
