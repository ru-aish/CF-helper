#!/usr/bin/env python3

import os
import json
from typing import Dict, List, Optional
from datetime import datetime
from google import genai
from dotenv import load_dotenv

load_dotenv()

class AITutorService:
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY')
        self.model_name = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')
        
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        # Initialize Gemini client
        self.client = genai.Client(api_key=self.api_key)
        
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
        """Create context string from problem data"""
        context_parts = [
            f"Problem: {problem_data.get('problem_id', 'Unknown')} - {problem_data.get('problem_title', 'Unknown')}",
            f"Contest: {problem_data.get('contest_title', 'N/A')}",
        ]
        
        if problem_data.get('statement'):
            context_parts.append(f"Problem Statement:\n{problem_data['statement']}")
        
        if problem_data.get('sample_inputs') and problem_data.get('sample_outputs'):
            context_parts.append("Sample Input/Output:")
            for i, (inp, out) in enumerate(zip(problem_data['sample_inputs'], problem_data['sample_outputs'])):
                context_parts.append(f"Example {i+1}:")
                context_parts.append(f"Input: {inp}")
                context_parts.append(f"Output: {out}")
        
        if problem_data.get('tags'):
            context_parts.append(f"Tags: {', '.join(problem_data['tags'])}")
        
        if problem_data.get('time_limit'):
            context_parts.append(f"Time Limit: {problem_data['time_limit']}")
        
        if problem_data.get('memory_limit'):
            context_parts.append(f"Memory Limit: {problem_data['memory_limit']}")
        
        return "\n\n".join(context_parts)
    
    def _create_conversation_context(self, conversation_history: List[Dict]) -> str:
        """Create conversation context from history"""
        if not conversation_history:
            return ""
        
        context_parts = ["Previous conversation:"]
        for entry in conversation_history[-10:]:  # Only include last 10 messages
            role = entry.get('role', 'unknown')
            message = entry.get('message', '')
            if role == 'user':
                context_parts.append(f"Student: {message}")
            elif role == 'assistant':
                context_parts.append(f"Tutor: {message}")
        
        return "\n".join(context_parts)
    
    def _make_api_call(self, prompt: str) -> str:
        """Make API call to Gemini"""
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            print(f"Error making API call: {e}")
            return "I apologize, but I'm having trouble processing your request right now. Please try again."
    
    def start_session(self, problem_data: Dict) -> str:
        """Start a new tutoring session"""
        problem_context = self._create_problem_context(problem_data)
        
        prompt = f"""{self.system_prompt}

{problem_context}

The student is starting to work on this problem. Provide a welcoming message that:
1. Briefly acknowledges the problem they're working on
2. Encourages them to share their initial thoughts or approach
3. Lets them know you're here to guide them through the problem-solving process
4. Asks what they understand about the problem so far or what their initial approach might be

Keep the message encouraging and concise (2-3 sentences)."""
        
        return self._make_api_call(prompt)
    
    def get_response(self, user_message: str, problem_data: Dict, conversation_history: List[Dict], hints_given: int) -> Dict:
        """Get AI response to user message"""
        problem_context = self._create_problem_context(problem_data)
        conversation_context = self._create_conversation_context(conversation_history)
        
        prompt = f"""{self.system_prompt}

{problem_context}

{conversation_context}

Student's current message: {user_message}

Number of hints already given: {hints_given}

Respond to the student's message following your role as a competitive programming tutor. If they're asking for a hint, provide appropriate guidance based on the number of hints already given. If they're sharing their approach or asking questions, provide supportive feedback and guidance."""
        
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
            0: "Provide a high-level conceptual hint about the general approach or key insight needed to solve this problem. Don't reveal specific algorithms or implementation details.",
            1: "Provide a more specific hint about the algorithmic technique or data structure that would be helpful for this problem.",
            2: "Provide implementation guidance or pseudocode structure that would help the student organize their solution.",
            3: "Provide a detailed explanation of the solution approach, including step-by-step methodology."
        }
        
        hint_level = min(hints_given, 3)
        instruction = hint_instructions[hint_level]
        
        prompt = f"""{self.system_prompt}

{problem_context}

{conversation_context}

This is hint #{hints_given + 1} for the student. {instruction}

Make sure your hint is encouraging and educational, helping the student learn the thinking process rather than just giving away the answer."""
        
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

The student is requesting the complete solution. Provide a comprehensive explanation that includes:

1. A clear explanation of the approach and algorithm
2. Step-by-step breakdown of the solution methodology
3. Code implementation (preferably in C++ for competitive programming)
4. Time and space complexity analysis
5. Key insights and learning points
6. Alternative approaches if applicable

Make this educational and help the student understand not just what the solution is, but why it works and how they could approach similar problems in the future."""
        
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