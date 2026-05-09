#!/bin/bash

# Codeforces AI Tutor - Server Startup Script
# This script starts the server and opens the browser

set -e  # Exit on any error

echo "🚀 CODEFORCES AI TUTOR - STARTING SERVER"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists and has API key
print_status "Checking configuration..."
if [ ! -f ".env" ]; then
    print_error ".env file not found. Please run ./install.sh first."
    exit 1
fi

# Check if GEMINI_API_KEY is set
if ! grep -q "GEMINI_API_KEY=.*[A-Za-z0-9]" .env; then
    print_error "GEMINI_API_KEY not set in .env file. Please add your API key."
    exit 1
fi

print_success "Configuration looks good"

# Get port from .env or use default
PORT=$(grep "FLASK_PORT=" .env | cut -d'=' -f2 || echo "5000")
HOST=$(grep "FLASK_HOST=" .env | cut -d'=' -f2 || echo "127.0.0.1")

print_status "Server will start on http://$HOST:$PORT"

# Function to open browser (cross-platform)
open_browser() {
    local url="http://$HOST:$PORT"
    print_status "Attempting to open browser..."
    
    # Wait a moment for server to start
    sleep 3
    
    # Try different commands based on OS
    if command -v xdg-open &> /dev/null; then
        # Linux
        xdg-open "$url" &
    elif command -v open &> /dev/null; then
        # macOS
        open "$url" &
    elif command -v start &> /dev/null; then
        # Windows (Git Bash/WSL)
        start "$url" &
    elif command -v python3 &> /dev/null; then
        # Fallback: use Python webbrowser module
        python3 -c "import webbrowser; webbrowser.open('$url')" &
    else
        print_warning "Could not auto-open browser. Please manually open: $url"
        return
    fi
    
    print_success "Browser opened to $url"
}

# Function to handle cleanup on exit
cleanup() {
    echo ""
    print_status "Shutting down server..."
    # Kill any background processes
    jobs -p | xargs -r kill
    print_success "Server stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if port is already in use
if command -v lsof &> /dev/null; then
    if lsof -i ":$PORT" &> /dev/null; then
        print_warning "Port $PORT appears to be in use"
        print_status "Attempting to kill existing process..."
        lsof -ti ":$PORT" | xargs -r kill -9
        sleep 2
    fi
fi

# Create PID file directory
mkdir -p .pids

print_status "Starting Codeforces AI Tutor server..."
print_status "Press Ctrl+C to stop the server"
echo ""

# Start the server in background and capture PID
python3 start_server.py &
SERVER_PID=$!

# Save PID for later cleanup
echo $SERVER_PID > .pids/server.pid

print_success "Server started with PID: $SERVER_PID"

# Open browser in background
open_browser &

print_status "Server is running..."
print_status "Access the application at: http://$HOST:$PORT"
print_status "Press Ctrl+C to stop"
echo ""
echo "📋 Available endpoints:"
echo "   • GET  /                    - Main web interface"
echo "   • POST /api/extract-problem - Extract problem from URL"
echo "   • POST /api/start-session   - Start tutoring session"
echo "   • POST /api/chat           - Chat with AI tutor"
echo "   • POST /api/get-hint       - Get progressive hints"
echo "   • POST /api/get-solution   - Get complete solution"
echo "   • GET  /api/health         - Health check"
echo ""

# Wait for server process
wait $SERVER_PID