#!/usr/bin/env python3

import os
import sys
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
from datetime import datetime
import traceback
import logging
from functools import wraps
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('api.log')
    ]
)
logger = logging.getLogger(__name__)

def log_api_call(f):
    """Decorator to log all API calls with detailed information"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = datetime.now()
        
        # Log request details
        logger.info(f"=== API CALL START: {request.endpoint} ===")
        logger.info(f"Method: {request.method}")
        logger.info(f"URL: {request.url}")
        logger.info(f"Headers: {dict(request.headers)}")
        
        if request.is_json:
            try:
                request_data = request.get_json()
                # Mask sensitive data if any
                logged_data = request_data.copy() if request_data else {}
                logger.info(f"Request JSON: {json.dumps(logged_data, indent=2)}")
            except Exception as e:
                logger.error(f"Failed to parse request JSON: {e}")
        
        try:
            # Call the actual function
            result = f(*args, **kwargs)
            
            # Log successful response
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            if isinstance(result, tuple):
                response_data, status_code = result
                logger.info(f"Response Status: {status_code}")
            else:
                response_data = result
                status_code = 200
                logger.info(f"Response Status: 200")
            
            logger.info(f"Duration: {duration:.3f}s")
            logger.info(f"=== API CALL END: {request.endpoint} ===")
            
            return result
            
        except Exception as e:
            # Log error
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            logger.error(f"API CALL FAILED: {request.endpoint}")
            logger.error(f"Error: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            logger.error(f"Duration: {duration:.3f}s")
            logger.error(f"=== API CALL END (ERROR): {request.endpoint} ===")
            
            raise e
    
    return decorated_function

# Add parent directory to path to import final.py
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)
from final import ComprehensiveCodeforcesSolutionExtractor

# Import AI service
from ai_service import AITutorService

# Flask app setup with disabled static folder
app = Flask(__name__, static_folder=None)
CORS(app)

# Initialize services
extractor = ComprehensiveCodeforcesSolutionExtractor()
ai_tutor = AITutorService()

# Store active sessions and conversations
active_sessions = {}
conversations = {}  # {conversation_id: {sessions: [], context: [], created_at: ...}}

# Frontend serving routes
@app.route('/')
def index():
    """Serve the main frontend page"""
    try:
        frontend_dir = os.path.join(project_root, 'frontend')
        return send_from_directory(frontend_dir, 'index.html')
    except Exception as e:
        return f"Error: {e}", 500

@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    try:
        static_dir = os.path.join(project_root, 'frontend', 'static')
        return send_from_directory(static_dir, filename)
    except Exception as e:
        return f"Error: {e}", 404

@app.route('/api/extract-problem', methods=['POST'])
@log_api_call
def extract_problem():
    """Extract problem data from Codeforces URL"""
    try:
        data = request.get_json()
        if not data or 'url' not in data:
            return jsonify({'error': 'URL is required'}), 400
        
        url = data['url'].strip()
        if not url:
            return jsonify({'error': 'Valid URL is required'}), 400
        
        # Process the problem URL
        success = extractor.process_problem_url(url)
        
        if not success:
            return jsonify({'error': 'Failed to extract problem data'}), 400
        
        # Get the extracted problem data
        # Extract problem ID from URL to find the data
        url_parts = url.split('/')
        problem_id = ""
        if 'contest' in url_parts and 'problem' in url_parts:
            contest_index = url_parts.index('contest')
            problem_index = url_parts.index('problem')
            if contest_index + 1 < len(url_parts) and problem_index + 1 < len(url_parts):
                contest_num = url_parts[contest_index + 1]
                problem_letter = url_parts[problem_index + 1]
                problem_id = contest_num + problem_letter
        elif 'problemset' in url_parts and 'problem' in url_parts:
            problem_index = url_parts.index('problem')
            if len(url_parts) > problem_index + 2:
                problem_id = url_parts[problem_index+1] + url_parts[problem_index+2]
        
        # Try multiple possible problem IDs since the scraper might save it differently
        possible_ids = [problem_id, f"problem{problem_id[-2:]}" if len(problem_id) >= 2 else problem_id]
        problem_data = None
        
        for pid in possible_ids:
            problem_data = extractor.search_problem(pid)
            if problem_data:
                break
        
        if not problem_data:
            return jsonify({'error': 'Problem data not found after extraction'}), 500
        
        # Format response data
        response_data = {
            'problem_id': problem_data['problem_id'],
            'title': problem_data['problem_title'],
            'contest_title': problem_data.get('contest_title', ''),
            'statement': problem_data.get('statement', ''),
            'time_limit': problem_data.get('time_limit', ''),
            'memory_limit': problem_data.get('memory_limit', ''),
            'sample_inputs': problem_data.get('sample_inputs', []),
            'sample_outputs': problem_data.get('sample_outputs', []),
            'tags': problem_data.get('tags', []),
            'url': problem_data.get('url', url),
            'has_hints': len(problem_data.get('hints', [])) > 0,
            'has_solutions': len(problem_data.get('solutions', [])) > 0,
            'has_tutorials': len(problem_data.get('tutorials', [])) > 0,
            'has_editorials': len(problem_data.get('editorials', [])) > 0
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error in extract_problem: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/start-session', methods=['POST'])
@log_api_call
def start_session():
    """Start a new tutoring session"""
    try:
        data = request.get_json()
        if not data or 'problem_id' not in data:
            return jsonify({'error': 'Problem ID is required'}), 400
        
        problem_id = data['problem_id']
        conversation_id = data.get('conversation_id')  # Optional conversation ID from frontend
        
        problem_data = extractor.search_problem(problem_id)
        
        if not problem_data:
            return jsonify({'error': 'Problem not found'}), 404
        
        # Create session
        session_id = f"{problem_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        session_data = {
            'session_id': session_id,
            'problem_id': problem_id,
            'problem_data': problem_data,
            'conversation_history': [],
            'hints_given': 0,
            'created_at': datetime.now().isoformat(),
            'last_activity': datetime.now().isoformat(),
            'conversation_id': conversation_id  # Link to conversation
        }
        
        active_sessions[session_id] = session_data
        
        # If conversation_id is provided, track this session in the conversation
        if conversation_id:
            if conversation_id not in conversations:
                conversations[conversation_id] = {
                    'id': conversation_id,
                    'sessions': [],
                    'context': [],
                    'created_at': datetime.now().isoformat(),
                    'last_updated': datetime.now().isoformat()
                }
            conversations[conversation_id]['sessions'].append(session_id)
            conversations[conversation_id]['last_updated'] = datetime.now().isoformat()
        
        # Generate welcome message
        welcome_message = ai_tutor.start_session(problem_data)
        
        session_data['conversation_history'].append({
            'role': 'assistant',
            'message': welcome_message,
            'timestamp': datetime.now().isoformat()
        })
        
        # Also add to conversation context if available
        if conversation_id and conversation_id in conversations:
            conversations[conversation_id]['context'].append({
                'role': 'assistant',
                'message': welcome_message,
                'timestamp': datetime.now().isoformat(),
                'session_id': session_id
            })
        
        return jsonify({
            'session_id': session_id,
            'welcome_message': welcome_message,
            'problem_title': problem_data['problem_title']
        })
        
    except Exception as e:
        print(f"Error in start_session: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/chat', methods=['POST'])
@log_api_call
def chat():
    """Handle chat messages in a tutoring session"""
    try:
        data = request.get_json()
        if not data or 'session_id' not in data or 'message' not in data:
            return jsonify({'error': 'Session ID and message are required'}), 400
        
        session_id = data['session_id']
        user_message = data['message'].strip()
        conversation_id = data.get('conversation_id')
        
        if session_id not in active_sessions:
            return jsonify({'error': 'Session not found or expired'}), 404
        
        session = active_sessions[session_id]
        
        # Update last activity
        session['last_activity'] = datetime.now().isoformat()
        
        # Get conversation context if available
        conversation_context = []
        if conversation_id and conversation_id in conversations:
            conversation_context = conversations[conversation_id]['context']
            conversations[conversation_id]['last_updated'] = datetime.now().isoformat()
        
        # Add user message to session history
        session['conversation_history'].append({
            'role': 'user',
            'message': user_message,
            'timestamp': datetime.now().isoformat()
        })
        
        # Add user message to conversation context
        if conversation_id and conversation_id in conversations:
            conversations[conversation_id]['context'].append({
                'role': 'user',
                'message': user_message,
                'timestamp': datetime.now().isoformat(),
                'session_id': session_id
            })
        
        # Use conversation context for AI response (more comprehensive context)
        context_to_use = conversation_context if conversation_context else session['conversation_history']
        
        # Get AI response
        ai_response = ai_tutor.get_response(
            user_message=user_message,
            problem_data=session['problem_data'],
            conversation_history=context_to_use,
            hints_given=session['hints_given']
        )
        
        # Update hints counter if this was a hint
        if ai_response.get('is_hint', False):
            session['hints_given'] += 1
        
        # Add AI response to session history
        session['conversation_history'].append({
            'role': 'assistant',
            'message': ai_response['message'],
            'timestamp': datetime.now().isoformat(),
            'is_hint': ai_response.get('is_hint', False)
        })
        
        # Add AI response to conversation context
        if conversation_id and conversation_id in conversations:
            conversations[conversation_id]['context'].append({
                'role': 'assistant',
                'message': ai_response['message'],
                'timestamp': datetime.now().isoformat(),
                'is_hint': ai_response.get('is_hint', False),
                'session_id': session_id
            })
        
        return jsonify({
            'message': ai_response['message'],
            'is_hint': ai_response.get('is_hint', False),
            'hints_given': session['hints_given']
        })
        
    except Exception as e:
        print(f"Error in chat: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/get-hint', methods=['POST'])
@log_api_call
def get_hint():
    """Get a progressive hint for the current problem"""
    try:
        data = request.get_json()
        if not data or 'session_id' not in data:
            return jsonify({'error': 'Session ID is required'}), 400
        
        session_id = data['session_id']
        conversation_id = data.get('conversation_id')
        
        if session_id not in active_sessions:
            return jsonify({'error': 'Session not found or expired'}), 404
        
        session = active_sessions[session_id]
        problem_data = session['problem_data']
        hints_given = session['hints_given']
        
        # Get conversation context if available
        conversation_context = []
        if conversation_id and conversation_id in conversations:
            conversation_context = conversations[conversation_id]['context']
            conversations[conversation_id]['last_updated'] = datetime.now().isoformat()
        
        # Use conversation context for hint generation
        context_to_use = conversation_context if conversation_context else session['conversation_history']
        
        # Get hint from AI tutor
        hint_response = ai_tutor.get_progressive_hint(
            problem_data=problem_data,
            hints_given=hints_given,
            conversation_history=context_to_use
        )
        
        # Update session
        session['hints_given'] += 1
        session['last_activity'] = datetime.now().isoformat()
        
        # Add to conversation history
        session['conversation_history'].append({
            'role': 'assistant',
            'message': hint_response['message'],
            'timestamp': datetime.now().isoformat(),
            'is_hint': True
        })
        
        # Add to conversation context
        if conversation_id and conversation_id in conversations:
            conversations[conversation_id]['context'].append({
                'role': 'assistant',
                'message': hint_response['message'],
                'timestamp': datetime.now().isoformat(),
                'is_hint': True,
                'session_id': session_id
            })
        
        return jsonify({
            'hint': hint_response['message'],
            'hint_number': session['hints_given'],
            'more_hints_available': hint_response.get('more_hints_available', True)
        })
        
    except Exception as e:
        print(f"Error in get_hint: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/get-solution', methods=['POST'])
@log_api_call
def get_solution():
    """Get the complete solution for the problem"""
    try:
        data = request.get_json()
        if not data or 'session_id' not in data:
            return jsonify({'error': 'Session ID is required'}), 400
        
        session_id = data['session_id']
        conversation_id = data.get('conversation_id')
        
        if session_id not in active_sessions:
            return jsonify({'error': 'Session not found or expired'}), 404
        
        session = active_sessions[session_id]
        problem_data = session['problem_data']
        
        # Get conversation context if available
        conversation_context = []
        if conversation_id and conversation_id in conversations:
            conversation_context = conversations[conversation_id]['context']
            conversations[conversation_id]['last_updated'] = datetime.now().isoformat()
        
        # Use conversation context for solution generation
        context_to_use = conversation_context if conversation_context else session['conversation_history']
        
        # Get solution from AI tutor
        solution_response = ai_tutor.get_complete_solution(
            problem_data=problem_data,
            conversation_history=context_to_use
        )
        
        # Update session
        session['last_activity'] = datetime.now().isoformat()
        
        # Add to conversation history
        session['conversation_history'].append({
            'role': 'assistant',
            'message': solution_response['message'],
            'timestamp': datetime.now().isoformat(),
            'is_solution': True
        })
        
        # Add to conversation context
        if conversation_id and conversation_id in conversations:
            conversations[conversation_id]['context'].append({
                'role': 'assistant',
                'message': solution_response['message'],
                'timestamp': datetime.now().isoformat(),
                'is_solution': True,
                'session_id': session_id
            })
        
        return jsonify({
            'solution': solution_response['message'],
            'explanation': solution_response.get('explanation', ''),
            'code': solution_response.get('code', ''),
            'complexity': solution_response.get('complexity', '')
        })
        
    except Exception as e:
        print(f"Error in get_solution: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/conversation/<conversation_id>/history', methods=['GET'])
@log_api_call
def get_conversation_history(conversation_id):
    """Get conversation history for a conversation"""
    try:
        if conversation_id not in conversations:
            return jsonify({'error': 'Conversation not found'}), 404
        
        conversation = conversations[conversation_id]
        return jsonify({
            'conversation_id': conversation_id,
            'context': conversation['context'],
            'sessions': conversation['sessions'],
            'created_at': conversation['created_at'],
            'last_updated': conversation['last_updated']
        })
        
    except Exception as e:
        print(f"Error in get_conversation_history: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/session/<session_id>/history', methods=['GET'])
@log_api_call
def get_session_history(session_id):
    """Get conversation history for a session"""
    try:
        if session_id not in active_sessions:
            return jsonify({'error': 'Session not found'}), 404
        
        session = active_sessions[session_id]
        return jsonify({
            'session_id': session_id,
            'problem_id': session['problem_id'],
            'conversation_history': session['conversation_history'],
            'hints_given': session['hints_given'],
            'created_at': session['created_at']
        })
        
    except Exception as e:
        print(f"Error in get_session_history: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'active_sessions': len(active_sessions),
        'active_conversations': len(conversations)
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    print(f"Starting Codeforces AI Tutor server on port {port}")
    print(f"Debug mode: {debug}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)