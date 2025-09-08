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

## Project Structure 📁

```
final code/
├── .env                    # Environment variables (API keys, config)
├── system_prompt.txt       # AI tutor behavior and personality
├── final.py               # Original Codeforces data extraction logic
├── start_server.py        # Main server startup script
├── requirements.txt       # Python dependencies
├── backend/               # Backend server code
│   ├── app.py            # Flask web server and API endpoints
│   └── ai_service.py     # Gemini AI integration service
└── frontend/             # Frontend web interface
    ├── index.html        # Main web page
    └── static/
        ├── css/
        │   └── styles.css    # Application styling
        └── js/
            └── app.js        # Frontend JavaScript logic
```

## Setup Instructions 🚀

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

The `.env` file contains your API key and configuration. Update it if needed:

```bash
# .env file
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.5-flash
FLASK_ENV=development
FLASK_DEBUG=True
FLASK_PORT=5000
```

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

## Customization 🛠️

### Modifying AI Behavior
Edit `system_prompt.txt` to change:
- Tutoring style and tone
- Hint progression strategy  
- Problem-solving methodology
- Encouragement patterns

### Extending Functionality
The modular architecture makes it easy to:
- Add new AI models or providers
- Implement additional problem sources
- Create custom analysis features
- Build team collaboration features

### Frontend Customization
- **CSS Variables**: Easy theme customization
- **Modular JavaScript**: Add new features easily
- **Responsive Design**: Adapts to different screen sizes

## Troubleshooting 🔧

### Common Issues

**Server won't start:**
- Check if port 5000 is available
- Verify all dependencies are installed
- Ensure `.env` file exists with valid API key

**Problem extraction fails:**
- Verify the Codeforces URL is correct
- Check internet connection
- Ensure Codeforces is accessible

**AI responses are poor:**
- Verify Gemini API key is valid
- Check `system_prompt.txt` for clarity
- Review conversation context limits

**Frontend not loading:**
- Ensure server is running on correct port
- Check browser console for JavaScript errors
- Verify static file paths are correct

### Debug Mode
Start with debug enabled to see detailed error messages:
```bash
FLASK_DEBUG=True python start_server.py
```

## Contributing 🤝

This is a modular, educational project. Feel free to:
- Add new AI models or providers
- Implement additional problem sources  
- Enhance the user interface
- Create new tutoring strategies

## License 📄

This project is for educational purposes. Please respect Codeforces terms of service when scraping problem data.

---

**Happy learning! 🎉**

Remember: The goal is not just to solve problems, but to understand the thinking process behind competitive programming. Use this tool to build your problem-solving intuition and algorithmic thinking skills.