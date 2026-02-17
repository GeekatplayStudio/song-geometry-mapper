@echo off
setlocal
title Song Geometry Mapper - Analyzer

echo ===================================================
echo Song Geometry Mapper - One-Click Analyzer (Windows)
echo ===================================================

echo [Analyzer] This script processes an audio file for both full-song and stem analysis.
echo.

set /p INPUT_FILE="Drag and Drop your audio file here and press Enter: "
if exist "%INPUT_FILE%" (
    echo.
) else (
    echo [ERROR] File not found: "%INPUT_FILE%"
    pause
    exit /b 1
)

set /p SEP_OPT="Do you want to SEPARATE STEMS (vocals/drums/etc)? (y/n) [Default: n]: "
set SEP_FLAGS=
if /i "%SEP_OPT%"=="y" (
    echo.
    echo Available Stems: vocals, drums, bass, other, all
    set /p CHOSEN_STEM="Enter stem(s) separated by space (e.g. 'vocals', 'drums', 'all') [Default: vocals]: "
    if "%CHOSEN_STEM%"=="" set CHOSEN_STEM=vocals
    set SEP_FLAGS=--separate %CHOSEN_STEM%
)

echo.
echo [INFO] Analyzing... Please wait. This may take a moment.
echo Input: %INPUT_FILE%
echo Separation: %SEP_FLAGS%

docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Running with Docker...
    docker compose run --rm analyzer ^
        --input "%INPUT_FILE%" ^
        --outdir /workspace/out ^
        --sr 48000 ^
        --norm none ^
        %SEP_FLAGS%
) else (
    echo [INFO] Running with Local Python...
    cd python
    call .venv\Scripts\activate.bat
    python -m bgm.analyze ^
        --input "%INPUT_FILE%" ^
        --outdir ..\out ^
        --sr 48000 ^
        --norm none ^
        %SEP_FLAGS%
    cd ..
)

echo.
echo [SUCCESS] Analysis complete! Check the 'out' folder.
echo You can now run 'start_web.bat' to view the map.
pause
