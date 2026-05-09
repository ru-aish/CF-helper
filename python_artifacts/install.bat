@echo off
REM Codeforces AI Tutor - Installation Script for Windows
REM This script installs all requirements without creating a virtual environment

setlocal enabledelayedexpansion

echo.
echo 🎯 CODEFORCES AI TUTOR - INSTALLATION (WINDOWS)
echo ====================================================
echo.

REM Check if Python is installed
echo [INFO] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python 3.7+ first.
    echo         Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo [SUCCESS] Python !PYTHON_VERSION! found

REM Check if pip is installed
echo [INFO] Checking pip installation...
pip --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] pip is not installed. Please install pip first.
    pause
    exit /b 1
)

echo [SUCCESS] pip found

REM Install requirements
echo [INFO] Installing Python requirements...
echo [WARNING] Installing packages globally (no virtual environment)

pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install requirements. Please check the error messages above.
    pause
    exit /b 1
)

echo [SUCCESS] All requirements installed successfully

REM Check if .env file exists
echo [INFO] Checking environment configuration...
if not exist ".env" (
    echo [WARNING] .env file not found. Creating template...
    (
        echo # Gemini AI Configuration
        echo GEMINI_API_KEY=your_gemini_api_key_here
        echo GEMINI_MODEL=gemini-1.5-flash
        echo.
        echo # Flask Configuration
        echo FLASK_ENV=development
        echo FLASK_DEBUG=True
        echo FLASK_PORT=5000
        echo FLASK_HOST=127.0.0.1
        echo.
        echo # Application Settings
        echo APP_NAME=Codeforces AI Tutor
        echo MAX_HINTS_PER_REQUEST=3
        echo CONVERSATION_TIMEOUT=3600
    ) > .env
    echo [WARNING] Please edit .env file and add your GEMINI_API_KEY
) else (
    echo [SUCCESS] .env file found
)

REM Check if problem database exists
echo [INFO] Checking problem database...
if not exist "comprehensive_codeforces_problems.json" (
    echo [WARNING] comprehensive_codeforces_problems.json not found
    echo [WARNING] The app will still work but may need to extract problems on demand
) else (
    echo [SUCCESS] Problem database found
)

REM Create logs directory if it doesn't exist
echo [INFO] Setting up logging...
if not exist "logs" mkdir logs
echo [SUCCESS] Logging directory ready

echo.
echo 🎉 INSTALLATION COMPLETE!
echo ========================
echo.
echo Next steps:
echo 1. Edit .env file and add your GEMINI_API_KEY
echo 2. Run: start.bat
echo 3. Open browser to: http://localhost:5000
echo.
echo Available scripts:
echo   start.bat   - Start the server and open browser
echo   stop.bat    - Stop the server
echo   deploy.bat  - Prepare for cloud deployment
echo.
pause