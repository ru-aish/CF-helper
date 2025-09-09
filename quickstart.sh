#!/bin/bash

# Codeforces AI Tutor - Quick Setup Script
# This script runs the complete setup: install, start server, and open browser

echo "⚡ CODEFORCES AI TUTOR - QUICK SETUP"
echo "==================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Make all scripts executable
chmod +x *.sh

print_status "Starting quick setup process..."

# Step 1: Install requirements
print_status "Step 1: Installing requirements..."
if ./install.sh; then
    print_success "Installation completed"
else
    print_error "Installation failed"
    exit 1
fi

echo ""

# Step 2: Check if API key is set
print_status "Step 2: Checking API key configuration..."
if grep -q "GEMINI_API_KEY=your_gemini_api_key_here" .env 2>/dev/null; then
    print_warning "Please set your GEMINI_API_KEY in .env file"
    print_status "Opening .env file for editing..."
    
    # Try to open .env file with available editors
    if command -v code &> /dev/null; then
        code .env
    elif command -v nano &> /dev/null; then
        nano .env
    elif command -v vim &> /dev/null; then
        vim .env
    elif command -v gedit &> /dev/null; then
        gedit .env &
    else
        print_warning "Please manually edit .env file and set your GEMINI_API_KEY"
    fi
    
    echo ""
    print_status "Press Enter after setting your API key to continue..."
    read
fi

# Step 3: Start the server
print_status "Step 3: Starting server and opening browser..."
print_success "Quick setup complete! Starting application..."
echo ""

# Run the start script
exec ./start.sh