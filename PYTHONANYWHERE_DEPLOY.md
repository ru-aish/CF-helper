# 🐍 PythonAnywhere Deployment Guide

## Prerequisites:
- PythonAnywhere account (free tier available)
- Your code on GitHub
- Gemini API key

## Step-by-Step Deployment:

### 1. **Sign Up / Login**
- Go to https://www.pythonanywhere.com
- Create free account or login

### 2. **Clone Your Repository**
Open a **Bash console** from dashboard:
```bash
git clone https://github.com/YOUR_USERNAME/CF-helper.git
cd CF-helper
```

### 3. **Create Virtual Environment**
```bash
python3.10 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. **Set Up Environment Variables**
```bash
cp .env.example .env
nano .env
# Add your GEMINI_API_KEY
# Press Ctrl+X, then Y, then Enter to save
```

### 5. **Configure Web App**
1. Go to **"Web"** tab on PythonAnywhere dashboard
2. Click **"Add a new web app"**
3. Choose **"Manual configuration"** (not Django/Flask wizard)
4. Select **Python 3.10**

### 6. **Configure WSGI File**
In the Web tab, click on **WSGI configuration file** link, replace ALL content with:

```python
import sys
import os
from dotenv import load_dotenv

# Add your project directory to the sys.path
project_home = '/home/YOUR_USERNAME/CF-helper'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Load environment variables
load_dotenv(os.path.join(project_home, '.env'))

# Add backend directory
sys.path.insert(0, os.path.join(project_home, 'backend'))

# Change to project directory
os.chdir(project_home)

# Import Flask app
from backend.app import app as application
```

**Replace `YOUR_USERNAME` with your PythonAnywhere username!**

### 7. **Configure Virtual Environment**
In the Web tab:
1. Find **"Virtualenv"** section
2. Enter: `/home/YOUR_USERNAME/CF-helper/venv`
3. Click checkmark

### 8. **Configure Static Files**
In the Web tab, add static file mappings:

| URL | Directory |
|-----|-----------|
| `/static/` | `/home/YOUR_USERNAME/CF-helper/frontend/static/` |
| `/` | `/home/YOUR_USERNAME/CF-helper/frontend/` |

### 9. **Reload Web App**
- Click the green **"Reload"** button at top
- Wait for it to complete

### 10. **Access Your App**
Your app will be live at:
```
https://YOUR_USERNAME.pythonanywhere.com
```

## Free Tier Limits:
- ✅ Always-on web app
- ✅ 512 MB disk space
- ✅ 1 web app
- ⚠️ CPU seconds limited (100/day)
- ⚠️ Outbound internet limited (whitelist required for some sites)

## Testing Deployment:
```bash
curl https://YOUR_USERNAME.pythonanywhere.com/api/health
```

## Important Notes:

### Whitelist Codeforces (Required!):
Free accounts need to whitelist external sites:
1. Go to **"Account"** → **"API token"**
2. Request whitelist for:
   - `codeforces.com`
   - `generativelanguage.googleapis.com`

### Update Code Later:
```bash
# SSH into PythonAnywhere console
cd ~/CF-helper
git pull
source venv/bin/activate
pip install -r requirements.txt  # if requirements changed
# Go to Web tab and click Reload
```

### View Logs:
- Web tab → **Error log** and **Server log** links
- Check if API key is loaded correctly

## Troubleshooting:

**500 Error?**
- Check error log in Web tab
- Verify WSGI file paths are correct
- Ensure virtualenv path is set

**API not working?**
- Check `.env` file has `GEMINI_API_KEY`
- Verify codeforces.com is whitelisted

**Static files not loading?**
- Verify static file mappings in Web tab
- Check paths match your username

## Alternative: Use WSGI Server
If you need better performance, edit WSGI to use Gunicorn (requires paid account).
