@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Song Geometry Mapper - WebM to MP4 Converter

echo ===================================================
echo Song Geometry Mapper - WebM to MP4 Converter
echo ===================================================

where ffmpeg >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERROR] ffmpeg is not installed or not in PATH.
  echo [INFO] Install ffmpeg and reopen terminal.
  goto :end
)

set "INPUT_FILE=%~1"
if "%INPUT_FILE%"=="" (
  echo.
  set /p INPUT_FILE=Drag and drop .webm file here and press Enter: 
)

set "INPUT_FILE=%INPUT_FILE:\"=%"
if not exist "%INPUT_FILE%" (
  echo [ERROR] File not found: "%INPUT_FILE%"
  goto :end
)

for %%I in ("%INPUT_FILE%") do (
  set "INPUT_DIR=%%~dpI"
  set "INPUT_STEM=%%~nI"
)
set "DEFAULT_OUTPUT=%INPUT_DIR%%INPUT_STEM%.mp4"

echo.
set /p OUTPUT_FILE=Output path [Default: %DEFAULT_OUTPUT%]: 
if "%OUTPUT_FILE%"=="" set "OUTPUT_FILE=%DEFAULT_OUTPUT%"
set "OUTPUT_FILE=%OUTPUT_FILE:\"=%"

echo.
set /p FORCE_4K=Force 4K output (pad/upscale) for delivery? (y/n) [Default: n]: 
if /I not "%FORCE_4K%"=="y" set "FORCE_4K=n"

echo.
if /I "%FORCE_4K%"=="y" (
  echo [INFO] Converting to MP4 (High Quality, 4K output)...
  ffmpeg -y ^
    -i "%INPUT_FILE%" ^
    -vf "scale=3840:2160:force_original_aspect_ratio=decrease,pad=3840:2160:(ow-iw)/2:(oh-ih)/2:color=black" ^
    -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p ^
    -c:a aac -b:a 320k ^
    -movflags +faststart ^
    "%OUTPUT_FILE%"
) else (
  echo [INFO] Converting to MP4 (High Quality, source resolution)...
  ffmpeg -y ^
    -i "%INPUT_FILE%" ^
    -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p ^
    -c:a aac -b:a 320k ^
    -movflags +faststart ^
    "%OUTPUT_FILE%"
)

if %errorlevel% neq 0 (
  echo [ERROR] Conversion failed.
  goto :end
)

echo.
echo [SUCCESS] MP4 created: "%OUTPUT_FILE%"

:end
pause
