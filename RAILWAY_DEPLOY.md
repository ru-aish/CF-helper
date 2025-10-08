# 🚀 Railway Deployment Guide

## Files Created for Railway:
✅ `Procfile` - Tells Railway how to start the app
✅ `railway.json` - Railway configuration
✅ `runtime.txt` - Python version (3.13.5)
✅ `.env.example` - Template for environment variables
✅ `start_server.py` - Updated to use PORT and 0.0.0.0

## Steps to Deploy:

### 1. **Push Code to GitHub**
```bash
git add .
git commit -m "Add Railway deployment configuration"
git push
```

### 2. **Deploy on Railway**
1. Go to https://railway.app
2. Sign up/Login with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your **CF-helper** repository
6. Railway will auto-detect and deploy

### 3. **Add Environment Variable (REQUIRED)**
After deployment:
1. Click on your project
2. Go to **"Variables"** tab
3. Click **"+ New Variable"**
4. Add:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your Gemini API key from https://aistudio.google.com/app/apikey
5. Click **"Add"**
6. App will automatically redeploy

### 4. **Get Your URL**
- After deployment completes, Railway gives you a public URL
- Click **"Settings"** → **"Generate Domain"**
- Your app will be live at: `https://your-app.railway.app`

## Free Tier Usage:
- Railway free tier: **$5 credit/month** (500 hours)
- Your app will sleep after inactivity (saves credits)
- Perfect for personal/testing use

## Verify Deployment:
Visit: `https://your-app.railway.app/api/health`
Should return: `{"status": "healthy"}`

## Troubleshooting:
- Check **"Deployments"** tab for build logs
- Check **"Observability"** for runtime logs
- Ensure `GEMINI_API_KEY` is set in Variables
