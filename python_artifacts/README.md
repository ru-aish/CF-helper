# Codeforces AI Tutor 🎯

An intelligent web application that helps you learn competitive programming by providing progressive hints, explanations, and guidance for Codeforces problems. The AI tutor guides you through problem-solving rather than just giving away solutions, with support for multiple conversations and advanced session management.

## Features ✨

- **Auto Problem Extraction**: Automatically extracts problem data when you paste Codeforces URLs
- **AI-Powered Tutoring**: Uses Gemini AI to provide intelligent coaching and personalized guidance
- **Multi-Conversation Support**: Work on multiple problems simultaneously with independent conversation contexts
- **Progressive Hints**: Get increasingly specific hints based on your progress and conversation history
- **Interactive Chat**: Discuss your approach and get personalized feedback with full conversation context
- **Code Analysis**: Submit your code for detailed analysis and suggestions
- **Session Persistence**: Your conversations are saved and restored across browser sessions
- **Modern UI**: Clean, responsive ChatGPT-like interface with VS Code-style syntax highlighting
- **Real-time Features**: Auto-scrolling, copy buttons, smooth animations, and loading states

## Project Structure 📁

```
final code/
├── .env                     # Environment variables (API keys, config)
├── system_prompt.txt        # AI tutor behavior and personality
├── final.py                # Codeforces data extraction logic
├── requirements.txt        # Python dependencies
├── Procfile               # Cloud deployment process definition
├── runtime.txt            # Python version for cloud deployment
├── DEPLOYMENT.md          # Detailed cloud deployment guide
├── backend/               # Backend server code
│   ├── app.py            # Flask web server with conversation management
│   └── ai_service.py     # Gemini AI integration service
├── frontend/             # Frontend web interface
│   ├── index.html        # Main web page with conversation sidebar
│   └── static/
│       ├── css/
│       │   └── styles.css    # Modern glassmorphism styling
│       └── js/
│           └── app.js        # Advanced conversation management
└── scripts/              # Automation scripts (Linux/macOS only)
    ├── install.sh        # Install dependencies without virtual env
    ├── start.sh          # Start server and open browser
    ├── stop.sh           # Stop running server
    ├── deploy.sh         # Prepare for cloud deployment
    ├── quickstart.sh     # Complete setup in one command
    └── health_check.py   # Health monitoring script
```

## Platform Compatibility 💻

### Linux/macOS Users 🐧🍎
- **Full automation**: All shell scripts work out of the box
- **One-command setup**: Use `./quickstart.sh` for instant setup
- **Auto browser opening**: Server starts and browser opens automatically
- **Process management**: Graceful start/stop with PID tracking

### Windows Users 🪟
- **Manual commands**: Use Python commands directly
- **Same functionality**: All features work, just different commands
- **Manual browser**: Open `http://localhost:5000` manually after starting
- **Ctrl+C to stop**: Use standard Windows process termination

### Command Reference

| Task | Linux/macOS | Windows |
|------|-------------|---------|
| **Install** | `./install.sh` | `pip3 install -r requirements.txt` |
| **Start** | `./start.sh` | `python3 start_server.py` |
| **Stop** | `./stop.sh` | `Ctrl+C` |
| **Health Check** | `python3 health_check.py` | `python health_check.py` |
| **Quick Start** | `./quickstart.sh` | Manual steps below |

### Cross-Platform Python Commands
These work on all platforms:
```bash
# Install dependencies
pip3 install -r requirements.txt

# Start server
python3 start_server.py

# Health check
python3 health_check.py

# Check Python version
python3 --version
```

## Quick Start 🚀

### Option 1: Automated Setup (Linux/macOS)
```bash
./quickstart.sh
```
This will:
1. Install all requirements (no virtual environment)
2. Guide you through API key setup
3. Start the server
4. Open your browser automatically

### Option 2: Manual Setup (All Platforms)

#### 1. Install Dependencies
**Linux/macOS:**
```bash
./install.sh
```

**Windows/Manual:**
```bash
pip3 install -r requirements.txt
```

#### 2. Configure Environment
Edit the `.env` file and add your Gemini API key:
```bash
# .env file
GEMINI_API_KEY=your_actual_api_key_here
GEMINI_MODEL=gemini-1.5-flash
FLASK_ENV=development
FLASK_DEBUG=True
FLASK_PORT=5000
```

#### 3. Start the Server
**Linux/macOS:**
```bash
./start.sh
```

**Windows/Manual:**
```bash
python3 start_server.py
```
Then manually open your browser to `http://localhost:5000`

#### 4. Stop the Server
**Linux/macOS:**
```bash
./stop.sh
```

**Windows/Manual:**
```bash
# Press Ctrl+C in the terminal where server is running
```

## Usage Guide 📚

### 1. Start a New Conversation
- Click "New Chat" to create a fresh conversation
- Each conversation maintains independent context and history

### 2. Work with Problems
- **Paste URL**: Simply paste a Codeforces URL (e.g., `https://codeforces.com/contest/2135/problem/C`)
- **Auto-Extraction**: Problem data is extracted automatically when you paste
- **Start Session**: Click "Start Session" to begin working with the AI tutor

### 3. Interactive Learning Features
- **Chat**: Discuss your approach, ask questions, share ideas
- **Progressive Hints**: Request hints that build on your conversation history
- **Code Analysis**: Submit your solution attempts for detailed feedback
- **Complete Solution**: View solution with explanation (use wisely!)

### 4. Multi-Conversation Workflow
- **Switch Conversations**: Click any conversation in the sidebar to switch contexts
- **Independent Sessions**: Each conversation tracks its own hints, progress, and context
- **Persistent Storage**: All conversations are saved and restored automatically

### 5. Learning Philosophy
The AI tutor follows these principles:
- **Contextual Guidance**: Uses your full conversation history for personalized help
- **Progressive Discovery**: Helps you discover solutions through guided thinking
- **Pattern Recognition**: Teaches problem-solving patterns and algorithmic thinking
- **Encouraging Exploration**: Motivates trying different approaches safely

## Advanced Features 🎮

### Conversation Management
- **Multiple Problems**: Work on different problems simultaneously
- **Context Isolation**: Each conversation maintains separate context
- **Session Persistence**: Conversations survive browser restarts
- **History Tracking**: Full message history with timestamps

### Enhanced UI/UX
- **Auto-Scrolling**: Smooth scrolling to new messages
- **Copy Buttons**: One-click code copying with visual feedback
- **Syntax Highlighting**: VS Code-style code highlighting
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop
- **Loading States**: Clear feedback during AI processing

### Smart Features
- **Auto-Extraction**: No need to manually extract - just paste URLs
- **Conversation Titles**: Automatically named based on problem information
- **Real-time Updates**: Live conversation list with last activity times
- **Error Handling**: Graceful error recovery with user-friendly messages

## Cloud Deployment ☁️

### Prepare for Deployment
**Linux/macOS:**
```bash
./deploy.sh
```

**Windows/Manual:**
Create the following files manually:

**Procfile:**
```
web: python start_server.py
```

**runtime.txt:**
```
python-3.11.0
```

This creates all necessary files for cloud deployment.

### Supported Platforms
- **Railway** (Recommended): Free tier with auto-deployment
- **Render**: Excellent free tier performance
- **Heroku**: Popular platform with easy setup
- **DigitalOcean**: VPS option for full control

### Quick Railway Deployment
1. Connect your GitHub repository to Railway
2. Set environment variables:
   - `GEMINI_API_KEY=your_api_key`
   - `FLASK_ENV=production`
   - `FLASK_DEBUG=False`
3. Deploy automatically on git push

See `DEPLOYMENT.md` for detailed platform-specific instructions.

## API Endpoints 🔗

### Problem Management
- `POST /api/extract-problem` - Extract problem from Codeforces URL
- `POST /api/start-session` - Start new tutoring session with conversation ID

### Conversation Interaction
- `POST /api/chat` - Send message to AI tutor with conversation context
- `POST /api/get-hint` - Get progressive hint based on conversation history
- `POST /api/get-solution` - Get complete solution with full context

### Session Management
- `GET /api/conversation/{id}/history` - Get conversation history
- `GET /api/session/{id}/history` - Get session-specific history
- `GET /api/health` - Server health check with conversation count

## Technical Architecture ⚙️

### Backend Features
- **Flask**: RESTful API with conversation state management
- **Conversation Isolation**: Independent context tracking per conversation
- **Session Persistence**: Robust session and conversation storage
- **Context-Aware AI**: AI responses use full conversation history
- **Comprehensive Logging**: Detailed request/response logging for debugging

### Frontend Architecture
- **Vanilla JavaScript**: Zero dependencies, fast loading
- **State Management**: Advanced conversation and session state handling
- **Local Storage**: Persistent conversation storage across sessions
- **Event-Driven**: Responsive UI with real-time updates
- **Error Recovery**: Graceful handling of network issues and timeouts

### Security & Performance
- **Environment Variables**: Secure API key management
- **CORS Protection**: Configurable cross-origin policies
- **Request Timeout**: Protection against hanging requests
- **Input Validation**: Comprehensive input sanitization
- **Error Handling**: User-friendly error messages

## Customization 🛠️

### AI Behavior
Edit `system_prompt.txt` to customize:
- Tutoring style and personality
- Hint progression strategy
- Problem-solving methodology
- Response format and tone

### Frontend Themes
Modify CSS variables in `styles.css`:
```css
:root {
  --bg: #0b0f1a;          /* Background color */
  --primary: #8b5cf6;     /* Primary accent */
  --text: #e5e7eb;        /* Text color */
  /* ... more variables */
}
```

### Conversation Management
- Modify conversation storage duration
- Customize conversation title generation
- Add conversation export/import features
- Implement conversation sharing

## Troubleshooting 🔧

### Common Issues

**Multiple conversations not working:**
- Clear browser localStorage: `localStorage.clear()`
- Check console for JavaScript errors
- Ensure latest code is deployed

**Conversations not persisting:**
- Check browser localStorage quota
- Verify `saveToLocalStorage()` is being called
- Look for JavaScript errors during save/load

**Auto-extraction not working:**
- Verify URL format is correct
- Check network connectivity
- Ensure backend extraction endpoint is responding

**Server issues:**
- Use health check to verify server status
- Check `api.log` for detailed error information
- Verify all environment variables are set

### Debug Mode
Enable comprehensive debugging:

**Linux/macOS:**
```bash
FLASK_DEBUG=True python3 start_server.py
```

**Windows:**
```bash
set FLASK_DEBUG=True && python start_server.py
```

### Health Monitoring
**Linux/macOS:**
```bash
python3 health_check.py
```

**Windows:**
```bash
python health_check.py
```

## Scripts Reference 📜

**Linux/macOS Users:**
- `./install.sh` - Install all requirements without virtual environment
- `./start.sh` - Start server and open browser automatically
- `./stop.sh` - Gracefully stop running server
- `./deploy.sh` - Prepare project for cloud deployment
- `./quickstart.sh` - Complete setup and start in one command
- `./health_check.py` - Monitor server health and availability

**Windows Users:**
- `pip3 install -r requirements.txt` - Install requirements
- `python3 start_server.py` - Start server (open browser manually)
- `Ctrl+C` - Stop server
- Create deployment files manually (see Cloud Deployment section)
- `python health_check.py` - Check server health

## Contributing 🤝

This project welcomes contributions for:
- New AI model integrations
- Enhanced conversation management features
- Additional problem source support
- UI/UX improvements
- Performance optimizations
- Mobile app development

## License 📄

This project is for educational purposes. Please respect Codeforces terms of service when using the platform.

---

## What's New in This Version 🆕

- ✅ **Multi-Conversation Support**: Work on multiple problems simultaneously
- ✅ **Auto-Extraction**: No more manual extraction - just paste URLs
- ✅ **Enhanced AI Context**: AI uses full conversation history for better responses
- ✅ **Session Persistence**: Conversations survive browser restarts
- ✅ **Modern UI**: ChatGPT-like interface with smooth animations
- ✅ **Cloud-Ready**: One-command deployment preparation
- ✅ **Cross-Platform**: Works on Linux, macOS, and Windows
- ✅ **Automation Scripts**: Complete setup and management automation (Linux/macOS)

**Happy learning! 🎉**

Remember: The goal is not just to solve problems, but to understand the thinking process behind competitive programming. Use this tool to build your problem-solving intuition and develop strong algorithmic thinking skills through guided practice.