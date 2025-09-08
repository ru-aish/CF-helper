#!/usr/bin/env python3

"""
Codeforces AI Tutor - Startup Script

This script starts the Flask backend server for the Codeforces AI Tutor web application.
"""

import os
import sys

def main():
    # Get the project root directory (where this script is located)
    project_root = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(project_root, 'backend')
    
    # Add backend directory to Python path
    sys.path.insert(0, backend_dir)
    
    # Set working directory to project root so relative paths work
    os.chdir(project_root)
    
    # Import and run the Flask app
    from app import app
    
    # Get configuration from environment
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    host = os.getenv('FLASK_HOST', '127.0.0.1')
    
    print("=" * 60)
    print("🎯 CODEFORCES AI TUTOR")
    print("=" * 60)
    print(f"🚀 Starting server on http://{host}:{port}")
    print(f"🔧 Debug mode: {debug}")
    print("📋 Available endpoints:")
    print("   • GET  /                    - Main web interface")
    print("   • POST /api/extract-problem - Extract problem from URL")
    print("   • POST /api/start-session   - Start tutoring session")
    print("   • POST /api/chat           - Chat with AI tutor")
    print("   • POST /api/get-hint       - Get progressive hints")
    print("   • POST /api/get-solution   - Get complete solution")
    print("   • GET  /api/health         - Health check")
    print("=" * 60)
    print("💡 Tip: Make sure your .env file contains valid GEMINI_API_KEY")
    print("🛑 Press Ctrl+C to stop the server")
    print("=" * 60)
    
    try:
        app.run(host=host, port=port, debug=debug)
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()