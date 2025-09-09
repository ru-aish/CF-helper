# Codeforces AI Tutor 🎯

An intelligent web application that helps you learn competitive programming by providing progressive hints, explanations, and guidance for Codeforces problems. The AI tutor guides you through problem-solving rather than just giving away solutions.

## Features ✨

- **Problem Extraction**: Automatically extracts problem data from Codeforces URLs
- **AI-Powered Tutoring**: Uses Gemini AI to provide intelligent coaching
- **Progressive Hints**: Get increasingly specific hints based on your progress
- **Interactive Chat**: Discuss your approach and get personalized feedback
- **Code Analysis**: Submit your code for detailed analysis and suggestions
- **Clean UI**: Modern, responsive interface that works on all devices
- **Session Management**: Maintain conversation context throughout your learning session

## Prerequisites 📋

- **Python 3.8+** (tested with Python 3.8, 3.9, 3.10, 3.11)
- **Gemini API Key** from Google AI Studio (free tier available)
- **Internet Connection** for Codeforces problem extraction and AI API calls

## Quick Start 🚀

Want to try it immediately? Here's the fastest way:

```bash
# 1. Clone the repository
git clone https://github.com/ru-aish/CF-helper.git
cd CF-helper

# 2. Install dependencies
pip install -r requirements.txt

# 3. Get your free Gemini API key from https://makersuite.google.com/app/apikey
# 4. Replace the API key in .env file (line 2)

# 5. Start the server
python start_server.py

# 6. Open http://localhost:5000 in your browser
```

You're ready to learn! 🎉

## Project Structure 📁

```
CF-helper/
├── .env                           # Environment variables (API keys, config)
├── system_prompt.txt              # AI tutor behavior and personality
├── final.py                       # Original Codeforces data extraction logic
├── start_server.py                # Main server startup script
├── requirements.txt               # Python dependencies
├── comprehensive_codeforces_problems.json  # Problem database cache
├── backend/                       # Backend server code
│   ├── app.py                    # Flask web server and API endpoints
│   └── ai_service.py             # Gemini AI integration service
└── frontend/                     # Frontend web interface
    ├── index.html                # Main web page
    └── static/
        ├── css/
        │   └── styles.css        # Application styling
        └── js/
            └── app.js            # Frontend JavaScript logic
```

## Setup Instructions 🚀

### 1. Install Dependencies

We recommend using a virtual environment:

```bash
# Create virtual environment (optional but recommended)
python -m venv cf-helper-env

# Activate virtual environment
# On Windows:
cf-helper-env\Scripts\activate
# On macOS/Linux:
source cf-helper-env/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

**⚠️ IMPORTANT**: You need to get your own Gemini API key and replace the placeholder:

1. **Get API Key**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey) to get a free Gemini API key
2. **Update .env file**: Replace the existing API key in `.env` with your own:

```bash
# .env file
GEMINI_API_KEY=your_actual_api_key_here  # ⚠️ Replace this!
GEMINI_MODEL=gemini-2.5-flash
FLASK_ENV=development
FLASK_DEBUG=True
FLASK_PORT=5000
```

**Security Note**: Never commit your real API key to version control. The key in the repository is a placeholder.

### 3. Customize AI Behavior (Optional)

Edit `system_prompt.txt` to modify how the AI tutor behaves:
- Coaching style and personality
- Hint progression strategy
- Encouragement approach

### 4. Start the Server

```bash
python start_server.py
```

The server will start on `http://localhost:5000` by default.

## Usage Guide 📚

### 1. Extract a Problem
- Enter a Codeforces problem URL (e.g., `https://codeforces.com/contest/2135/problem/C`)
- Click "Extract Problem" to fetch problem data
- Review the problem statement, constraints, and sample tests

### 2. Start Tutoring Session
- Click "Start Tutoring Session" to begin working with the AI tutor
- The AI will greet you and ask about your initial thoughts

### 3. Interactive Learning
- **Chat**: Discuss your approach, ask questions, share ideas
- **Get Hints**: Request progressive hints that guide your thinking
- **Analyze Code**: Submit your solution attempts for detailed feedback
- **Get Solution**: View complete solution with explanation (use sparingly!)

### 4. Learning Philosophy
The AI tutor follows these principles:
- **Guide, don't solve**: Helps you discover solutions rather than giving them away
- **Progressive hints**: Starts broad, becomes more specific based on your needs
- **Encourage exploration**: Motivates you to try different approaches
- **Build understanding**: Focuses on teaching problem-solving patterns

## Example Interactions 💬

Here's what a typical tutoring session looks like:

### Problem Analysis
```
You: "I'm looking at this problem about finding the maximum subarray sum."

AI Tutor: "Great! Before we dive into coding, let's think about the problem structure. 
What patterns do you notice in the sample inputs and outputs? What's the key insight here?"
```

### Getting Progressive Hints
```
You: "I'm stuck on the approach."

AI Tutor: "Let's break it down step by step:
1. First hint: Think about what happens when you encounter a negative number
2. Second hint: Consider keeping track of the best sum you've seen so far
3. Third hint: What if you restart your calculation at certain points?"
```

### Code Review
```
You: [Submits code with a bug]

AI Tutor: "I see you're on the right track! Your loop structure is good, but I notice 
an issue with how you're handling the running sum. What happens when your current 
sum becomes negative? Try tracing through the second example manually."
```

## API Endpoints 🔗

### Problem Management
- `POST /api/extract-problem` - Extract problem from Codeforces URL
- `POST /api/start-session` - Start new tutoring session

### Tutoring Interaction  
- `POST /api/chat` - Send message to AI tutor
- `POST /api/get-hint` - Get progressive hint
- `POST /api/get-solution` - Get complete solution

### Utilities
- `GET /api/health` - Server health check
- `GET /api/session/{id}/history` - Get conversation history

## Technical Details ⚙️

### Backend Architecture
- **Flask**: Web framework for API endpoints
- **Gemini AI**: Google's AI model for intelligent tutoring
- **Cloudscraper**: Bypasses Cloudflare protection for Codeforces
- **BeautifulSoup**: Parses HTML to extract problem data

### Frontend Architecture
- **Vanilla JavaScript**: Clean, dependency-free frontend
- **Responsive CSS**: Works on desktop, tablet, and mobile
- **Progressive Enhancement**: Graceful degradation for older browsers

### Security Features
- **Environment Variables**: API keys stored securely
- **Input Validation**: Prevents malicious input
- **CORS Protection**: Controlled cross-origin requests

## Contributing 🤝

We welcome contributions! This project is designed to be educational and extensible.

### Ways to Contribute
- **Add new AI models**: Implement support for Claude, GPT, or other models
- **Enhance problem sources**: Add support for AtCoder, LeetCode, or other platforms
- **Improve the UI**: Better responsive design, dark mode, accessibility features
- **Create new tutoring strategies**: Different coaching approaches for different skill levels
- **Add testing**: Unit tests, integration tests, end-to-end tests
- **Documentation**: Tutorials, examples, API documentation

### Contribution Guidelines
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with clear, minimal modifications
4. Test your changes thoroughly
5. Update documentation if needed
6. Submit a pull request with a clear description

### Code Style
- Follow existing code patterns and structure
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and modular

## Performance & Limitations ⚡

### Rate Limits
- **Gemini API**: 60 requests per minute (free tier)
- **Codeforces**: Be respectful, don't spam requests
- **Recommendation**: Wait 1-2 seconds between API calls

### Memory Usage
- Problem cache is stored in `comprehensive_codeforces_problems.json`
- Conversation history is kept in memory (resets on server restart)
- Large conversations may hit context limits (~4000 tokens)

### Browser Compatibility
- **Modern browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Mobile**: iOS Safari 13+, Android Chrome 80+
- **Progressive enhancement**: Graceful degradation for older browsers

## Troubleshooting 🔧

### Common Issues

**Server won't start:**
- Check if port 5000 is available: `netstat -an | grep 5000` (or try a different port)
- Verify all dependencies are installed: `pip list | grep -E "(Flask|google-generativeai)"`
- Ensure `.env` file exists with valid API key
- Try running with: `python -c "import flask, google.generativeai; print('Dependencies OK')"`

**Problem extraction fails:**
- Verify the Codeforces URL format: `https://codeforces.com/contest/{number}/problem/{letter}`
- Check internet connection and Codeforces accessibility
- Some contests may be private or require login - try public contests
- Check if Cloudflare is blocking requests (rare)

**AI responses are poor or error:**
- Verify Gemini API key is valid and has quota remaining
- Check [Google AI Studio](https://makersuite.google.com/app/apikey) for API status
- Review `system_prompt.txt` for any custom modifications
- Monitor conversation length - very long chats may hit context limits

**Frontend not loading:**
- Ensure server is running on correct port (check terminal output)
- Try accessing `http://127.0.0.1:5000` instead of `localhost:5000`
- Check browser console (F12) for JavaScript errors
- Verify static file paths are correct

**API Rate Limits:**
- Gemini API has rate limits - wait a few seconds between requests
- For heavy usage, consider implementing request queuing
- Monitor your API usage in Google AI Studio

### Debug Mode
Start with debug enabled to see detailed error messages:
```bash
FLASK_DEBUG=True python start_server.py
```

### Getting Help
If you're still stuck:
1. Check the terminal output for error messages
2. Look at the browser console (F12 → Console tab)
3. Verify your Python version: `python --version`
4. Test your API key: Visit [Google AI Studio](https://makersuite.google.com/app/apikey)

## Development & Contributing 🛠️

### Development Setup
```bash
# Fork the repository on GitHub
git clone https://github.com/your-username/CF-helper.git
cd CF-helper

# Create development environment
python -m venv dev-env
source dev-env/bin/activate  # On Windows: dev-env\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start development server
python start_server.py
```

### Code Structure
- **Backend (`backend/`)**: Flask API with AI service integration
- **Frontend (`frontend/`)**: Vanilla JavaScript SPA with responsive design
- **Core Logic (`final.py`)**: Codeforces scraping and data extraction
- **Configuration**: Environment-based config in `.env`

### Adding Features
The modular architecture makes it easy to:
- **Add new AI models**: Extend `ai_service.py` with new providers
- **Implement additional problem sources**: Create new extraction modules
- **Create custom analysis features**: Add new API endpoints in `app.py`
- **Build team collaboration features**: Extend the session management

### Customizing AI Behavior
Edit `system_prompt.txt` to modify:
- Tutoring style and tone
- Hint progression strategy  
- Problem-solving methodology
- Encouragement patterns

### Frontend Customization
- **CSS Variables**: Easy theme customization in `styles.css`
- **Modular JavaScript**: Add new features in `app.js`
- **Responsive Design**: Adapts to different screen sizes automatically

## Deployment 🚀

### Local Production
```bash
# Set production environment
export FLASK_ENV=production
export FLASK_DEBUG=False

# Use a production WSGI server
pip install gunicorn
gunicorn --bind 0.0.0.0:5000 --chdir backend app:app
```

### Cloud Deployment
The application can be deployed to:
- **Heroku**: Add `Procfile` with `web: gunicorn --chdir backend app:app`
- **Railway**: Works out of the box with `start_server.py`
- **DigitalOcean App Platform**: Use the GitHub integration
- **AWS EC2**: Standard Python web app deployment

### Environment Variables for Production
```bash
GEMINI_API_KEY=your_production_api_key
GEMINI_MODEL=gemini-2.5-flash
FLASK_ENV=production
FLASK_DEBUG=False
FLASK_PORT=5000
```

### Security Considerations
- Never expose your `.env` file in production
- Use environment variables or secure secret management
- Consider implementing rate limiting for public deployments
- Monitor API usage and costs

## Contributing 🤝

We welcome contributions! This project is designed to be educational and extensible.

### Ways to Contribute
- **Add new AI models**: Implement support for Claude, GPT, or other models
- **Enhance problem sources**: Add support for AtCoder, LeetCode, or other platforms
- **Improve the UI**: Better responsive design, dark mode, accessibility features
- **Create new tutoring strategies**: Different coaching approaches for different skill levels
- **Add testing**: Unit tests, integration tests, end-to-end tests
- **Documentation**: Tutorials, examples, API documentation

### Contribution Guidelines
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with clear, minimal modifications
4. Test your changes thoroughly
5. Update documentation if needed
6. Submit a pull request with a clear description

### Code Style
- Follow existing code patterns and structure
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and modular

## Performance & Limitations ⚡

### Rate Limits
- **Gemini API**: 60 requests per minute (free tier)
- **Codeforces**: Be respectful, don't spam requests
- **Recommendation**: Wait 1-2 seconds between API calls

### Memory Usage
- Problem cache is stored in `comprehensive_codeforces_problems.json`
- Conversation history is kept in memory (resets on server restart)
- Large conversations may hit context limits (~4000 tokens)

### Browser Compatibility
- **Modern browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Mobile**: iOS Safari 13+, Android Chrome 80+
- **Progressive enhancement**: Graceful degradation for older browsers

## License 📄

This project is for educational purposes. Please respect:
- **Codeforces Terms of Service** when scraping problem data
- **Google AI Terms** when using Gemini API
- **Fair Use**: Don't abuse the APIs or create excessive server load

## Acknowledgments 🙏

- **Codeforces** for providing excellent competitive programming problems
- **Google AI** for the powerful Gemini API
- **Open Source Community** for the libraries and tools that make this possible

---

**Happy learning! 🎉**

Remember: The goal is not just to solve problems, but to understand the thinking process behind competitive programming. Use this tool to build your problem-solving intuition and algorithmic thinking skills.

*"The best way to learn programming is by practicing, and the best way to practice is with a good mentor."* - This AI tutor aims to be that mentor for your competitive programming journey.