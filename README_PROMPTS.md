# CF-Helper: Complete Prompt Documentation

This document explains exactly what data is extracted from Codeforces and how it's sent to the AI.

## 📁 Files Created

1. **`FULL_PROMPT_EXAMPLES.txt`** - Complete examples of all 5 prompt types
2. **`EXTRACTED_DATA_2135C.txt`** - Actual data extracted from problem 2135C
3. **`example_prompt_sent_to_ai.txt`** - Real prompt for "overview" request

## 🔍 Data Extraction Process

### From Problem Page (e.g., https://codeforces.com/problemset/problem/2135/C)

The system extracts:

| Data Field | Example Value |
|------------|---------------|
| Contest Title | "Codeforces Round 1046 (Div. 1)" |
| Problem ID | "2135C" |
| Problem Title | "C. By the Assignment" |
| Time Limit | "4 seconds" |
| Memory Limit | "512 megabytes" |
| Problem Statement | Full text with math notation |
| Sample Inputs | All test case inputs |
| Sample Outputs | All expected outputs |
| Notes | Explanations of samples |
| Tags | ["binary search", "bitmasks", ...] |
| Tutorial Links | Links to editorial page |

**Code Location:** `final.py` lines 40-173

### From Editorial Page (if available)

The system extracts from spoiler sections:

| Content Type | Description |
|--------------|-------------|
| Hints | Spoilers with "hint" in title |
| Solutions | Spoilers with "solution" or "code" in title |
| Tutorials | Spoilers with "tutorial" in title |
| Editorials | Spoilers with "editorial" in title |

Each item includes:
- Title
- Text explanation
- Code blocks (if any)

**Code Location:** `final.py` lines 206-356

## 🤖 AI Prompt Structure

### Model Used
- **Gemini 2.5 Flash Lite**
- Supports 1M+ token context window
- Streaming responses supported

### System Prompt (Always Included)

```
You are a competitive programming expert helping with Codeforces problems. 
Be concise, technical, and actionable.

**Response Length:**
- Keep responses SHORT and focused (3-6 sentences for most queries)

**Communication Style:**
- Direct technical insights with precise terminology
- Focus on the most important insight first
- Explain WHY an approach works, not just WHAT to do
- Assume user knows basic DSA concepts
```

**File Location:** `system_prompt.txt`, `prompts/system_prompt.txt`

## 📝 5 Types of Prompts

### 1. Overview Request (Session Start)

**When:** Student first opens a problem

**Format:**
```
{system_prompt}

{problem_context} [includes full statement, samples, tags, limits]

The student is starting to work on this problem. 
Give a brief technical overview (1-2 sentences).
```

**Code:** `ai_service.py` lines 154-164

### 2. Conversation Request (User Question)

**When:** User asks a question

**Format:**
```
{system_prompt}

{problem_context}

{conversation_history} [last 10 messages]

Student's message: {user_message}
Hints given: {hints_given}

Respond concisely and technically. Be direct and helpful.
```

**Code:** `ai_service.py` lines 166-208

### 3. Progressive Hint Request

**When:** User clicks "Give me a hint" button

**Hint Levels:**
- Hint 1: Main algorithm/technique (1-2 sentences)
- Hint 2: Data structures/approach (1-2 sentences)
- Hint 3: Implementation details (1-2 sentences)
- Hint 4: Detailed solution explanation

**Format:**
```
{system_prompt}

{problem_context}

{conversation_history}

Hint #{hints_given + 1}: {hint_instruction}
Be concise and technical.
```

**Code:** `ai_service.py` lines 210-239

### 4. Complete Solution Request

**When:** User asks for full solution

**Format:**
```
{system_prompt}

{problem_context}

{conversation_history}

=== AVAILABLE REFERENCE SOLUTIONS ===
[Up to 5 code solutions from editorial]

Provide a complete solution with:
1. Clear approach explanation (3-5 sentences)
2. Clean C++ code implementation
3. Time and space complexity analysis
4. Key insights (2-3 bullet points)
```

**Code:** `ai_service.py` lines 241-308

### 5. Code Analysis Request

**When:** User submits their code for review

**Format:**
```
{system_prompt}

{problem_context}

=== STUDENT'S SUBMITTED CODE ===
{student_code}

Please analyze their code:
1. Correctness Analysis
2. Algorithm Identification
3. Bugs or Issues
4. Time/Space Complexity
5. Optimization Suggestions
6. Code Quality
7. Test Case Analysis
```

**Code:** `ai_service.py` lines 310-334

## 📊 Problem Context Format

Every prompt includes this comprehensive context:

```
Problem: {problem_id} - {problem_title}

=== FULL PROBLEM STATEMENT ===
{complete_statement}

=== SAMPLE TEST CASES ===
Sample 1:
Input: {input}
Output: {output}
Explanation: {explanation}
[... all samples ...]

=== TAGS ===
{comma_separated_tags}

Time Limit: {time_limit}
Memory Limit: {memory_limit}

=== NOTES ===
{notes_section}
```

**Code:** `ai_service.py` lines 35-88

## 🎯 Example: Problem 2135C

For the problem at https://codeforces.com/problemset/problem/2135/C:

**Extracted from problem page:**
- Problem ID: 2135C
- Title: "C. By the Assignment"
- Time: 4 seconds, Memory: 512 MB
- 5 sample test cases
- 8 tags (binary search, bitmasks, combinatorics, dfs, dsu, graphs, math, *2000)
- Full problem statement with XOR constraints

**Extracted from editorial:**
- 4 hints about cycles and XOR properties
- 3 solutions (including C++ implementation)
- Reference code using Tarjan's algorithm for 2-edge-connected components

**Prompt size for overview:** ~5,269 characters

See `EXTRACTED_DATA_2135C.txt` for complete data.

## 🔧 Key Implementation Details

### Context Limits
- **Problem statement:** Full text (no truncation)
- **Conversation history:** Last 10 messages
- **Message length:** Up to 5000 chars per message
- **Reference solutions:** Up to 5 code implementations

### Streaming Support
- Uses `generate_content_stream()` for real-time responses
- Yields text chunks as they arrive
- Fallback to non-streaming if needed

### Error Handling
- Quota exceeded: "API quota exceeded. Please try again later."
- Generic errors: "I'm having trouble processing your request."
- Includes full traceback in logs

## 📂 Project Structure

```
CF-helper/
├── final.py                    # Web scraping (Codeforces data extraction)
├── backend/
│   ├── app.py                  # Flask API server
│   └── ai_service.py           # AI integration (Gemini)
├── prompts/
│   ├── system_prompt.txt       # AI behavior definition
│   ├── code_analysis_prompt.txt
│   └── solution_prompt.txt
├── frontend/
│   ├── index.html
│   └── static/
│       ├── js/app.js
│       └── css/styles.css
└── comprehensive_codeforces_problems.json  # Problem database
```

## 🚀 Usage Flow

1. User enters problem URL
2. `final.py` scrapes problem page → extracts basic info
3. `final.py` follows tutorial link → extracts editorial content
4. Data saved to JSON database
5. User interacts with problem
6. `ai_service.py` formats context + user message → sends to Gemini
7. Gemini responds with technical guidance
8. Response streamed back to frontend

## 📄 See Full Examples

- **`FULL_PROMPT_EXAMPLES.txt`** - All 5 prompt types with explanations
- **`EXTRACTED_DATA_2135C.txt`** - Real problem data
- **`example_prompt_sent_to_ai.txt`** - Actual prompt sent to AI

---

Generated on: $(date)
