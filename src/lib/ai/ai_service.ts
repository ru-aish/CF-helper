import { GoogleGenerativeAI } from '@google/generative-ai';
import { ExtractedProblem, ContentItem } from '../scraper/extractor';
import fs from 'fs';
import path from 'path';

// Define Message structure based on Prisma json schema for conversations
export interface ChatMessage {
  role: 'user' | 'assistant';
  message: string;
  timestamp: string;
  is_hint?: boolean;
  is_solution?: boolean;
  session_id?: string;
}

export class AITutorService {
  private ai: GoogleGenerativeAI;
  private modelName: string;
  private systemPrompt: string;

  constructor(modelName?: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not found in environment variables");
    }

    this.ai = new GoogleGenerativeAI(apiKey);
    // Use gemini-3.1-flash-lite as the default as requested
    this.modelName = modelName || process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
    this.systemPrompt = this.loadSystemPrompt();
  }

  private loadSystemPrompt(): string {
    try {
      const promptFile = path.join(process.cwd(), 'python_artifacts', 'system_prompt.txt');
      if (fs.existsSync(promptFile)) {
        return fs.readFileSync(promptFile, 'utf-8').trim();
      }
      return "You are a helpful competitive programming tutor.";
    } catch (e) {
      console.warn("Could not load system prompt:", e);
      return "You are a helpful competitive programming tutor.";
    }
  }

  private createProblemContext(problemData: ExtractedProblem): string {
    const contextParts = [
      `Problem: ${problemData.problemId} - ${problemData.title}`
    ];

    if (problemData.statement) {
      contextParts.push(`\n=== FULL PROBLEM STATEMENT ===\n${problemData.statement}\n`);
    }

    if (problemData.sampleInputs && problemData.sampleOutputs) {
      contextParts.push("\n=== SAMPLE TEST CASES ===");
      problemData.sampleInputs.forEach((inp, idx) => {
        const out = problemData.sampleOutputs[idx] || '';
        contextParts.push(`\nSample ${idx + 1}:`);
        contextParts.push(`Input:\n${inp}`);
        contextParts.push(`Output:\n${out}`);
      });
    }

    if (problemData.tags && problemData.tags.length > 0) {
      contextParts.push(`\n=== TAGS ===\n${problemData.tags.join(', ')}`);
    }

    if (problemData.timeLimit) {
      contextParts.push(`Time Limit: ${problemData.timeLimit}`);
    }

    if (problemData.memoryLimit) {
      contextParts.push(`Memory Limit: ${problemData.memoryLimit}`);
    }

    return contextParts.join('\n');
  }

  private createConversationContext(history: ChatMessage[]): string {
    if (!history || history.length === 0) {
      return "This is the start of the conversation.";
    }

    const recentHistory = history.slice(-10);
    const contextParts = ["=== CONVERSATION HISTORY ==="];

    recentHistory.forEach((msg, idx) => {
      let content = msg.message;
      if (content.length > 5000) {
        content = content.substring(0, 5000) + "... [truncated]";
      }
      contextParts.push(`\n[Message ${idx + 1}] ${msg.role.toUpperCase()}:`);
      contextParts.push(content);
    });

    return contextParts.join('\n');
  }

  async startSession(problemData: ExtractedProblem): Promise<string> {
    const problemContext = this.createProblemContext(problemData);
    const prompt = `${this.systemPrompt}\n\n${problemContext}\n\nThe student is starting to work on this problem. Give a brief technical overview (1-2 sentences) of what kind of problem this is and what approach category it belongs to.`;

    const model = this.ai.getGenerativeModel({ model: this.modelName });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  }

  async getResponseStream(userMessage: string, problemData: ExtractedProblem, history: ChatMessage[], hintsGiven: number) {
    const problemContext = this.createProblemContext(problemData);
    const conversationContext = this.createConversationContext(history);

    const prompt = `${this.systemPrompt}\n\n${problemContext}\n\n${conversationContext}\n\nStudent's message: ${userMessage}\nHints given: ${hintsGiven}\n\nRespond concisely and technically. Be direct and helpful.`;

    const model = this.ai.getGenerativeModel({ model: this.modelName });
    return await model.generateContentStream(prompt);
  }

  async getProgressiveHint(problemData: ExtractedProblem, hintsGiven: number, history: ChatMessage[]) {
    const problemContext = this.createProblemContext(problemData);
    const conversationContext = this.createConversationContext(history);

    const hintInstructions: Record<number, string> = {
      0: "Give a direct hint about the main algorithm or technique needed (1-2 sentences).",
      1: "Suggest specific data structures or implementation approach (1-2 sentences).",
      2: "Provide key implementation details or optimization insights (1-2 sentences).",
      3: "Give a detailed solution explanation with approach and complexity."
    };

    const hintLevel = Math.min(hintsGiven, 3);
    const instruction = hintInstructions[hintLevel];

    const prompt = `${this.systemPrompt}\n\n${problemContext}\n\n${conversationContext}\n\nHint #${hintsGiven + 1}: ${instruction}\nBe concise and technical.`;

    const model = this.ai.getGenerativeModel({ model: this.modelName });
    const result = await model.generateContent(prompt);

    return {
      message: result.response.text().trim(),
      moreHintsAvailable: hintsGiven < 3
    };
  }

  async getCompleteSolution(problemData: ExtractedProblem, history: ChatMessage[]) {
    const problemContext = this.createProblemContext(problemData);
    const conversationContext = this.createConversationContext(history);

    const availableSolutions: string[] = [];
    if (problemData.solutions) {
      problemData.solutions.forEach(s => availableSolutions.push(...(s.codes || [])));
    }
    if (problemData.editorials) {
      problemData.editorials.forEach(e => availableSolutions.push(...(e.codes || [])));
    }

    let solutionContext = "";
    if (availableSolutions.length > 0) {
      solutionContext = `\n=== AVAILABLE REFERENCE SOLUTIONS ===\n`;
      availableSolutions.slice(0, 5).forEach((sol, idx) => {
        solutionContext += `\n--- Reference Solution ${idx + 1} ---\n${sol}\n`;
      });
    }

    const prompt = `${this.systemPrompt}\n\n${problemContext}\n\n${conversationContext}\n\n${solutionContext}\n\nProvide a complete solution with:\n1. Clear approach explanation (3-5 sentences covering the main algorithm and key insights)\n2. Clean, well-structured code implementation in C++ (use comments only for complex logic)\n3. Time and space complexity analysis\n4. Key insights or optimizations (2-3 bullet points)\n\nFocus on clarity, correctness, and efficiency. Explain the intuition behind the approach.`;

    const model = this.ai.getGenerativeModel({ model: this.modelName });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Parse out code block and complexity
    const lines = responseText.split('\n');
    const codeBlocks: string[] = [];
    let complexityInfo = "";

    let inCodeBlock = false;
    let currentCode: string[] = [];

    for (const line of lines) {
      if (line.includes('```')) {
        if (inCodeBlock) {
          codeBlocks.push(currentCode.join('\n'));
          currentCode = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
      } else if (inCodeBlock) {
        currentCode.push(line);
      } else if (line.toLowerCase().includes('complexity') && (line.includes('O(') || line.toLowerCase().includes('time:') || line.toLowerCase().includes('space:'))) {
        complexityInfo = line.trim();
      }
    }

    return {
      message: responseText,
      explanation: responseText,
      code: codeBlocks.length > 0 ? codeBlocks[0] : "",
      complexity: complexityInfo
    };
  }
}
