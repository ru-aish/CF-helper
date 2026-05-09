#!/bin/bash

# Codeforces AI Tutor - Stop Server Script
# This script stops the running server

echo "🛑 CODEFORCES AI TUTOR - STOPPING SERVER"
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

# Get port from .env or use default
PORT=$(grep "FLASK_PORT=" .env 2>/dev/null | cut -d'=' -f2 || echo "5000")

print_status "Stopping server on port $PORT..."

# Method 1: Kill using PID file
if [ -f ".pids/server.pid" ]; then
    PID=$(cat .pids/server.pid)
    if kill -0 $PID 2>/dev/null; then
        print_status "Killing server process (PID: $PID)..."
        kill $PID
        sleep 2
        
        # Force kill if still running
        if kill -0 $PID 2>/dev/null; then
            print_warning "Process still running, force killing..."
            kill -9 $PID
        fi
        
        rm -f .pids/server.pid
        print_success "Server stopped using PID file"
    else
        print_warning "PID file exists but process is not running"
        rm -f .pids/server.pid
    fi
else
    print_status "No PID file found, trying alternative methods..."
fi

# Method 2: Kill by port (if lsof is available)
if command -v lsof &> /dev/null; then
    PIDS=$(lsof -ti ":$PORT" 2>/dev/null || true)
    if [ ! -z "$PIDS" ]; then
        print_status "Found processes on port $PORT: $PIDS"
        echo $PIDS | xargs -r kill
        sleep 2
        
        # Force kill if still running
        PIDS=$(lsof -ti ":$PORT" 2>/dev/null || true)
        if [ ! -z "$PIDS" ]; then
            print_warning "Some processes still running, force killing..."
            echo $PIDS | xargs -r kill -9
        fi
        print_success "Server stopped using port lookup"
    else
        print_status "No processes found on port $PORT"
    fi
fi

# Method 3: Kill by process name
PIDS=$(pgrep -f "start_server.py" 2>/dev/null || true)
if [ ! -z "$PIDS" ]; then
    print_status "Found start_server.py processes: $PIDS"
    echo $PIDS | xargs -r kill
    sleep 2
    
    # Force kill if still running
    PIDS=$(pgrep -f "start_server.py" 2>/dev/null || true)
    if [ ! -z "$PIDS" ]; then
        print_warning "Some processes still running, force killing..."
        echo $PIDS | xargs -r kill -9
    fi
    print_success "Server stopped using process name lookup"
fi

# Clean up PID directory
rm -rf .pids

# Final check
if command -v lsof &> /dev/null; then
    if lsof -i ":$PORT" &> /dev/null; then
        print_warning "Something is still running on port $PORT"
        print_status "Process details:"
        lsof -i ":$PORT"
    else
        print_success "Port $PORT is now free"
    fi
else
    print_success "Server stop completed"
fi

echo ""
print_success "Stop script completed"
print_status "You can start the server again with: ./start.sh"