#!/bin/bash

# Codeforces AI Tutor - Installation Script
# This script installs all requirements without creating a virtual environment

set -e  # Exit on any error

echo "🎯 CODEFORCES AI TUTOR - INSTALLATION"
echo "===================================="

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

# Check if Python is installed
print_status "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
print_success "Python $PYTHON_VERSION found"

# Check if pip is installed
print_status "Checking pip installation..."
if ! command -v pip3 &> /dev/null; then
    print_error "pip3 is not installed. Please install pip3 first."
    exit 1
fi

print_success "pip3 found"

# Install requirements
print_status "Installing Python requirements..."
print_warning "Installing packages globally (no virtual environment)"

if pip3 install -r requirements.txt; then
    print_success "All requirements installed successfully"
else
    print_error "Failed to install requirements. Please check the error messages above."
    exit 1
fi

# Check if .env file exists
print_status "Checking environment configuration..."
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating template..."
    cat > .env << EOL
# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
FLASK_PORT=5000
FLASK_HOST=127.0.0.1

# Application Settings
APP_NAME=Codeforces AI Tutor
MAX_HINTS_PER_REQUEST=3
CONVERSATION_TIMEOUT=3600
EOL
    print_warning "Please edit .env file and add your GEMINI_API_KEY"
else
    print_success ".env file found"
fi

# Check if comprehensive_codeforces_problems.json exists
print_status "Checking problem database..."
if [ ! -f "comprehensive_codeforces_problems.json" ]; then
    print_warning "comprehensive_codeforces_problems.json not found"
    print_warning "The app will still work but may need to extract problems on demand"
else
    print_success "Problem database found"
fi

# Create logs directory if it doesn't exist
print_status "Setting up logging..."
mkdir -p logs
print_success "Logging directory ready"

# Make scripts executable
print_status "Setting up scripts..."
chmod +x start.sh 2>/dev/null || true
chmod +x stop.sh 2>/dev/null || true
chmod +x deploy.sh 2>/dev/null || true
print_success "Scripts are executable"

echo ""
echo "🎉 INSTALLATION COMPLETE!"
echo "========================"
echo ""
echo "Next steps:"
echo "1. Edit .env file and add your GEMINI_API_KEY"
echo "2. Run: ./start.sh"
echo "3. Open browser to: http://localhost:5000"
echo ""
echo "Available scripts:"
echo "  ./start.sh  - Start the server and open browser"
echo "  ./stop.sh   - Stop the server"
echo "  ./deploy.sh - Prepare for cloud deployment"
echo ""