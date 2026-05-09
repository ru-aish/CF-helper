"""
WSGI configuration for PythonAnywhere deployment
Replace YOUR_USERNAME with your actual PythonAnywhere username
"""
import sys
import os
from dotenv import load_dotenv

# Add your project directory to the sys.path
project_home = '/home/YOUR_USERNAME/CF-helper'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Load environment variables from .env file
load_dotenv(os.path.join(project_home, '.env'))

# Add backend directory to path
sys.path.insert(0, os.path.join(project_home, 'backend'))

# Change working directory to project root
os.chdir(project_home)

# Import Flask app
from backend.app import app as application

# For debugging (remove in production)
# print("Python path:", sys.path)
# print("GEMINI_API_KEY set:", bool(os.getenv('GEMINI_API_KEY')))
