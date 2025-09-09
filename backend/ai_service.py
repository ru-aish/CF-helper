#!/usr/bin/env python3

import os
import json
from typing import Dict, List, Optional
from datetime import datetime
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class AITutorService:
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY')
        self.model_name = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')  # Use standard flash model
        
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        # Initialize Gemini client
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(self.model_name)
        
        # Load system prompt
        self.system_prompt = self._load_system_prompt()
        
    def _load_system_prompt(self) -> str:
        """Load system prompt from file"""
        try:
            prompt_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'system_prompt.txt')
            with open(prompt_file, 'r', encoding='utf-8') as f:
                return f.read().strip()
        except Exception as e:
            print(f"Warning: Could not load system prompt: {e}")
            return "You are a helpful competitive programming tutor."
    
    def _create_problem_context(self, problem_data: Dict) -> str:
        """Create context string from problem data - simplified for speed"""
        context_parts = [
            f"Problem: {problem_data.get('problem_id', 'Unknown')} - {problem_data.get('problem_title', 'Unknown')}"
        ]
        
        if problem_data.get('statement'):
            # Truncate statement to first 300 characters for speed
            statement = problem_data['statement']
            if len(statement) > 300:
                statement = statement[:300] + "..."
            context_parts.append(f"Statement: {statement}")
        
        if problem_data.get('sample_inputs') and problem_data.get('sample_outputs'):
            # Only include first sample for speed
            inp = problem_data['sample_inputs'][0] if problem_data['sample_inputs'] else ""
            out = problem_data['sample_outputs'][0] if problem_data['sample_outputs'] else ""
            context_parts.append(f"Sample: Input: {inp} | Output: {out}")
        
        if problem_data.get('tags'):
            # Limit to first 3 tags
            tags = problem_data['tags'][:3]
            context_parts.append(f"Tags: {', '.join(tags)}")
        
        return "\n".join(context_parts)
    
    def _create_conversation_context(self, conversation_history: List[Dict]) -> str:
        """Create conversation context from history - limit to last 3 messages for speed"""
        if not conversation_history:
            return "This is the start of the conversation."
        
        # Limit to last 3 messages for faster processing and conciseness
        recent_history = conversation_history[-3:] if len(conversation_history) > 3 else conversation_history
        
        context_parts = ["Recent conversation:"]
        for entry in recent_history:
            role = entry.get('role', 'unknown')
            message = entry.get('message', '')
            # Truncate very long messages more aggressively 
            if len(message) > 150:
                message = message[:150] + "..."
            context_parts.append(f"{role}: {message}")
        
        return "\n".join(context_parts)
    
    def _make_api_call(self, prompt: str) -> str:
        """Make API call to Gemini with timeout"""
        import time
        import signal
        import threading
        from concurrent.futures import ThreadPoolExecutor, TimeoutError
        
        def timeout_handler(signum, frame):
            raise TimeoutError("API call timed out")
        
        def api_call():
            return self.model.generate_content(prompt)
        
        try:
            start_time = time.time()
            print(f"Making API call with model: {self.model_name}")
            
            # Use ThreadPoolExecutor with timeout for API call
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(api_call)
                try:
                    response = future.result(timeout=20)  # 20 second timeout
                except TimeoutError:
                    print("API call timed out after 20 seconds")
                    return "I'm experiencing response delays. Please try again or use a simpler question."
            
            elapsed = time.time() - start_time
            print(f"API call completed in {elapsed:.2f} seconds")
            
            if hasattr(response, 'text'):
                return response.text.strip()
            else:
                print(f"Unexpected response format: {response}")
                return "I received an unexpected response format. Please try again."
                
        except Exception as e:
            print(f"Error making API call: {e}")
            print(f"Error type: {type(e)}")
            import traceback
            traceback.print_exc()
            
            # Return a more helpful error message
            if "timeout" in str(e).lower():
                return "The AI response timed out. Please try asking a more specific question."
            elif "quota" in str(e).lower() or "limit" in str(e).lower():
                return "API quota exceeded. Please try again later."
            else:
                return "I'm having trouble processing your request. Please try again or rephrase your question."
    
    def start_session(self, problem_data: Dict) -> str:
        """Start a new tutoring session"""
        problem_context = self._create_problem_context(problem_data)
        
        prompt = f"""{self.system_prompt}

{problem_context}

The student is starting to work on this problem. Give a brief welcome (1-2 sentences) and ask what they'd like help with or what they've tried so far."""
        
        return self._make_api_call(prompt)
    
    def get_response(self, user_message: str, problem_data: Dict, conversation_history: List[Dict], hints_given: int) -> Dict:
        """Get AI response to user message"""
        problem_context = self._create_problem_context(problem_data)
        conversation_context = self._create_conversation_context(conversation_history)
        
        prompt = f"""{self.system_prompt}

{problem_context}

{conversation_context}

Student's message: {user_message}
Hints given: {hints_given}

Respond concisely and technically. Be direct and helpful."""
        
        response_text = self._make_api_call(prompt)
        
        # Determine if this is a hint
        is_hint = any(keyword in user_message.lower() for keyword in ['hint', 'help', 'stuck', 'don\'t know', 'how to'])
        
        return {
            'message': response_text,
            'is_hint': is_hint
        }
    
    def get_progressive_hint(self, problem_data: Dict, hints_given: int, conversation_history: List[Dict]) -> Dict:
        """Get a progressive hint based on the number of hints already given"""
        problem_context = self._create_problem_context(problem_data)
        conversation_context = self._create_conversation_context(conversation_history)
        
        hint_instructions = {
            0: "Give a direct hint about the main algorithm or technique needed (1-2 sentences).",
            1: "Suggest specific data structures or implementation approach (1-2 sentences).", 
            2: "Provide key implementation details or optimization insights (1-2 sentences).",
            3: "Give a detailed solution explanation with approach and complexity."
        }
        
        hint_level = min(hints_given, 3)
        instruction = hint_instructions[hint_level]
        
        prompt = f"""{self.system_prompt}

{problem_context}

{conversation_context}

Hint #{hints_given + 1}: {instruction}
Be concise and technical."""
        
        response_text = self._make_api_call(prompt)
        
        return {
            'message': response_text,
            'more_hints_available': hints_given < 3
        }
    
    def get_complete_solution(self, problem_data: Dict, conversation_history: List[Dict]) -> Dict:
        """Get the complete solution with explanation"""
        problem_context = self._create_problem_context(problem_data)
        conversation_context = self._create_conversation_context(conversation_history)
        
        # Check if we have solutions in the problem data
        available_solutions = []
        if problem_data.get('solutions'):
            for solution in problem_data['solutions']:
                if solution.get('codes'):
                    available_solutions.extend(solution['codes'])
        
        if problem_data.get('editorials'):
            for editorial in problem_data['editorials']:
                if editorial.get('codes'):
                    available_solutions.extend(editorial['codes'])
        
        solution_context = ""
        if available_solutions:
            solution_context = f"\nAvailable reference solutions:\n{chr(10).join(available_solutions[:2])}"  # Include first 2 solutions
        
        prompt = f"""{self.system_prompt}

{problem_context}

{conversation_context}

{solution_context}

Provide a complete solution with:
1. Brief approach explanation (2-3 sentences)
2. Clean code implementation in C++ (minimal comments only for complex parts)
3. Time/space complexity
4. Key insight (1 sentence)

Focus on clarity and efficiency. Avoid excessive commenting."""
        
        response_text = self._make_api_call(prompt)
        
        # Try to extract code and complexity from response
        lines = response_text.split('\n')
        code_blocks = []
        complexity_info = ""
        
        in_code_block = False
        current_code = []
        
        for line in lines:
            if '```' in line:
                if in_code_block:
                    code_blocks.append('\n'.join(current_code))
                    current_code = []
                    in_code_block = False
                else:
                    in_code_block = True
            elif in_code_block:
                current_code.append(line)
            elif 'complexity' in line.lower() and ('O(' in line or 'time:' in line.lower() or 'space:' in line.lower()):
                complexity_info = line.strip()
        
        return {
            'message': response_text,
            'explanation': response_text,  # Full response as explanation
            'code': code_blocks[0] if code_blocks else "",
            'complexity': complexity_info
        }
    
    def analyze_student_code(self, student_code: str, problem_data: Dict) -> str:
        """Analyze student's code submission"""
        problem_context = self._create_problem_context(problem_data)
        
        prompt = f"""{self.system_prompt}

{problem_context}

The student has submitted the following code:

```
{student_code}
```

Please analyze their code and provide constructive feedback including:
1. What they did well
2. Any issues or bugs you notice
3. Suggestions for improvement
4. Whether their approach is correct
5. Performance considerations

Be encouraging and educational in your feedback."""
        
        return self._make_api_call(prompt)