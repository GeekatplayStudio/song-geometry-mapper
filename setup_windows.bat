@echo off
setlocal
title Song Geometry Mapper - Setup

echo ===================================================
echo Song Geometry Mapper - One-Click Setup (Windows)
echo ===================================================

REM Check for Docker
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Docker detected. Setting up Docker environment...
    docker compose build analyzer
    if errorlevel 1 (
        echo [ERROR] Docker build failed.
        pause
        exit /b 1
    )
    echo [SUCCESS] Docker environment ready.
    goto :end
)

REM Check for Python if Docker missing
echo [INFO] Docker not found. Checking for Python 3.11+...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Neither Docker nor Python found. Please install Docker Desktop OR Python 3.11+.
    pause
    exit /b 1
)

echo [INFO] Python detected. Setting up local virtual environment...
cd python
if not exist .venv (
    python -m venv .venv
    echo [INFO] Created .venv
)

call .venv\Scripts\activate.bat
echo [INFO] Installing dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

REM Check for Demucs availability
python -c "import demucs" >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Audio separation (Demucs) is available.
) else (
    echo [INFO] Note: Audio separation requires 'demucs'. It is included in requirements.txt.
)

echo [SUCCESS] Local Python environment ready.
cd ..

:end
echo.
echo Setup complete! You can now use 'analyze_song.bat' and 'start_web.bat'.
pause
