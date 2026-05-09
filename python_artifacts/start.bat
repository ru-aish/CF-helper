@echo off
REM Codeforces AI Tutor - Server Startup Script for Windows
REM This script starts the server and opens the browser

setlocal enabledelayedexpansion

echo.
echo 🚀 CODEFORCES AI TUTOR - STARTING SERVER (WINDOWS)
echo ===================================================
echo.

REM Check if .env file exists and has API key
echo [INFO] Checking configuration...
if not exist ".env" (
    echo [ERROR] .env file not found. Please run install.bat first.
    pause
    exit /b 1
)

REM Check if GEMINI_API_KEY is set (basic check)
findstr /C:"GEMINI_API_KEY=" ".env" | findstr /V "your_gemini_api_key_here" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] GEMINI_API_KEY not set in .env file. Please add your API key.
    echo [INFO] Opening .env file for editing...
    notepad .env
    echo [INFO] Please save the file and run this script again.
    pause
    exit /b 1
)

echo [SUCCESS] Configuration looks good

REM Get port from .env or use default
set PORT=5000
set HOST=127.0.0.1
for /f "tokens=2 delims==" %%a in ('findstr "FLASK_PORT=" .env 2^>nul') do set PORT=%%a
for /f "tokens=2 delims==" %%a in ('findstr "FLASK_HOST=" .env 2^>nul') do set HOST=%%a

echo [INFO] Server will start on http://!HOST!:!PORT!

REM Check if port is already in use
netstat -an | findstr ":!PORT!" >nul 2>&1
if not errorlevel 1 (
    echo [WARNING] Port !PORT! appears to be in use
    echo [INFO] Attempting to continue anyway...
)

REM Create PID file directory
if not exist ".pids" mkdir .pids

echo [INFO] Starting Codeforces AI Tutor server...
echo [INFO] Press Ctrl+C to stop the server
echo.

REM Start the server
echo [SUCCESS] Server starting...
echo [INFO] Access the application at: http://!HOST!:!PORT!
echo [INFO] Press Ctrl+C to stop
echo.
echo 📋 Available endpoints:
echo    • GET  /                    - Main web interface
echo    • POST /api/extract-problem - Extract problem from URL
echo    • POST /api/start-session   - Start tutoring session
echo    • POST /api/chat           - Chat with AI tutor
echo    • POST /api/get-hint       - Get progressive hints
echo    • POST /api/get-solution   - Get complete solution
echo    • GET  /api/health         - Health check
echo.

REM Open browser after a short delay
timeout /t 3 /nobreak >nul 2>&1
start http://!HOST!:!PORT!
echo [SUCCESS] Browser opened to http://!HOST!:!PORT!

REM Start Python server
python start_server.py

echo.
echo [INFO] Server stopped
pause