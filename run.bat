@echo off
title KhmerDubStudio Launcher
echo ========================================================
echo    KhmerDubStudio - AI Video Dubbing Desktop Suite
echo ========================================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not found in system PATH.
    echo Please install Python 3.10+ and check "Add Python to PATH".
    pause
    exit /b 1
)

echo [1/2] Verifying and installing dependencies...
python -m pip install -r requirements.txt

echo.
echo [2/2] Launching KhmerDubStudio Desktop Application...
python app.py

if errorlevel 1 (
    echo.
    echo [ERROR] Application exited with an error.
    pause
)
