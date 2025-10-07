#!/usr/bin/env python3

import os
import json
from typing import Dict, List, Optional, Generator
from datetime import datetime
from google import genai
from dotenv import load_dotenv

load_dotenv()

class AITutorService:
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY')
        self.model_name = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash-lite')
        
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
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
        """Create comprehensive context string from problem data - full details for Gemini 2.5"""
        context_parts = [
            f"Problem: {problem_data.get('problem_id', 'Unknown')} - {problem_data.get('problem_title', 'Unknown')}"
        ]
        
        # Include FULL problem statement (Gemini 2.5 can handle 1M+ tokens)
        if problem_data.get('statement'):
            context_parts.append(f"\n=== FULL PROBLEM STATEMENT ===\n{problem_data['statement']}\n")
        
        # Include ALL constraints
        if problem_data.get('input_format'):
            context_parts.append(f"\n=== INPUT FORMAT ===\n{problem_data['input_format']}\n")
        
        if problem_data.get('output_format'):
            context_parts.append(f"\n=== OUTPUT FORMAT ===\n{problem_data['output_format']}\n")
        
        if problem_data.get('constraints'):
            context_parts.append(f"\n=== CONSTRAINTS ===\n{problem_data['constraints']}\n")
        
        # Include ALL sample test cases
        if problem_data.get('sample_inputs') and problem_data.get('sample_outputs'):
            context_parts.append("\n=== SAMPLE TEST CASES ===")
            for i, (inp, out) in enumerate(zip(problem_data['sample_inputs'], problem_data['sample_outputs']), 1):
                context_parts.append(f"\nSample {i}:")
                context_parts.append(f"Input:\n{inp}")
                context_parts.append(f"Output:\n{out}")
                # Include explanations if available
                if problem_data.get('sample_explanations') and i-1 < len(problem_data['sample_explanations']):
                    context_parts.append(f"Explanation: {problem_data['sample_explanations'][i-1]}")
        
        # Include ALL tags
        if problem_data.get('tags'):
            context_parts.append(f"\n=== TAGS ===\n{', '.join(problem_data['tags'])}")
        
        # Include difficulty and rating
        if problem_data.get('difficulty'):
            context_parts.append(f"\nDifficulty: {problem_data['difficulty']}")
        
        if problem_data.get('rating'):
            context_parts.append(f"Rating: {problem_data['rating']}")
        
        # Include time and memory limits
        if problem_data.get('time_limit'):
            context_parts.append(f"Time Limit: {problem_data['time_limit']}")
        
        if problem_data.get('memory_limit'):
            context_parts.append(f"Memory Limit: {problem_data['memory_limit']}")
        
        # Include any notes or special information
        if problem_data.get('notes'):
            context_parts.append(f"\n=== NOTES ===\n{problem_data['notes']}\n")
        
        return "\n".join(context_parts)
    
    def _create_conversation_context(self, conversation_history: List[Dict]) -> str:
        """Create comprehensive conversation context from history - full context for Gemini 2.5"""
        if not conversation_history:
            return "This is the start of the conversation."
        
        # Include last 10 messages for rich context (Gemini 2.5 can handle it)
        recent_history = conversation_history[-10:] if len(conversation_history) > 10 else conversation_history
        
        context_parts = ["=== CONVERSATION HISTORY ==="]
        for i, entry in enumerate(recent_history, 1):
            role = entry.get('role', 'unknown').upper()
            message = entry.get('message', '')
            # Keep full messages up to 5000 characters (no aggressive truncation)
            if len(message) > 5000:
                message = message[:5000] + "... [truncated]"
            context_parts.append(f"\n[Message {i}] {role}:")
            context_parts.append(message)
        
        return "\n".join(context_parts)
    
    def _make_api_call_stream(self, prompt: str) -> Generator[str, None, None]:
        """Make streaming API call to Gemini"""
        try:
            print(f"Making streaming API call with model: {self.model_name}")
            
            for chunk in self.client.models.generate_content_stream(
                model=self.model_name,
                contents=prompt
            ):
                if chunk.text:
                    yield chunk.text
                    
        except Exception as e:
            print(f"Error in streaming API call: {e}")
            import traceback
            traceback.print_exc()
            yield f"\n\n[Error: {str(e)}]"
    
    def _make_api_call(self, prompt: str) -> str:
        """Make non-streaming API call to Gemini (for backward compatibility)"""
        try:
            print(f"Making non-streaming API call with model: {self.model_name}")
            
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            
            if hasattr(response, 'text'):
                return response.text.strip()
            else:
                print(f"Unexpected response format: {response}")
                return "I received an unexpected response format. Please try again."
                
        except Exception as e:
            print(f"Error making API call: {e}")
            import traceback
            traceback.print_exc()
            
            if "quota" in str(e).lower() or "limit" in str(e).lower():
                return "API quota exceeded. Please try again later."
            else:
                return "I'm having trouble processing your request. Please try again or rephrase your question."
    
    def start_session(self, problem_data: Dict) -> str:
        """Start a new tutoring session"""
        problem_context = self._create_problem_context(problem_data)
        
        prompt = f"""{self.system_prompt}

{problem_context}

The student is starting to work on this problem. Give a brief technical overview (1-2 sentences) of what kind of problem this is and what approach category it belongs to."""
        
        return self._make_api_call(prompt)
    
    def get_response_stream(self, user_message: str, problem_data: Dict, conversation_history: List[Dict], hints_given: int) -> Generator[str, None, None]:
        """Get streaming AI response to user message"""
        problem_context = self._create_problem_context(problem_data)
        conversation_context = self._create_conversation_context(conversation_history)
        
        prompt = f"""{self.system_prompt}

{problem_context}

{conversation_context}

Student's message: {user_message}
Hints given: {hints_given}

Respond concisely and technically. Be direct and helpful."""
        
        yield from self._make_api_call_stream(prompt)
    
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
        
        # Include ALL available solutions and editorials (Gemini 2.5 can handle large context)
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
            solution_context = f"\n=== AVAILABLE REFERENCE SOLUTIONS ===\n"
            for idx, sol in enumerate(available_solutions[:5], 1):  # Include up to 5 reference solutions
                solution_context += f"\n--- Reference Solution {idx} ---\n{sol}\n"
        
        prompt = f"""{self.system_prompt}

{problem_context}

{conversation_context}

{solution_context}

Provide a complete solution with:
1. Clear approach explanation (3-5 sentences covering the main algorithm and key insights)
2. Clean, well-structured code implementation in C++ (use comments only for complex logic)
3. Time and space complexity analysis
4. Key insights or optimizations (2-3 bullet points)

Focus on clarity, correctness, and efficiency. Explain the intuition behind the approach."""
        
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
        """Analyze student's code submission with full problem context"""
        problem_context = self._create_problem_context(problem_data)
        
        prompt = f"""{self.system_prompt}

{problem_context}

=== STUDENT'S SUBMITTED CODE ===
```
{student_code}
```

Please analyze their code comprehensively and provide:
1. **Correctness Analysis**: Is the approach correct? Does it solve the problem?
2. **Algorithm Identification**: What algorithm/technique did they use?
3. **Bugs or Issues**: Any logical errors, edge cases missed, or implementation bugs?
4. **Time/Space Complexity**: Analyze their solution's complexity
5. **Optimization Suggestions**: How can this be improved?
6. **Code Quality**: Comments on code structure, readability, and best practices
7. **Test Case Analysis**: Will it pass all sample tests? Any edge cases it might fail?

Be thorough, constructive, and specific. Point out exact lines if there are issues."""
        
        return self._make_api_call(prompt)