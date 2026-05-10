import { useState, useRef, useEffect } from 'react';
import { Markdown } from './Markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (msg: string) => void;
  onGetHint: () => void;
  onGetSolution: () => void;
}

export function Chat({ messages, isLoading, onSendMessage, onGetHint, onGetSolution }: ChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-subtle flex-col">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
            <h3 className="text-xl font-medium mb-2">Codeforces AI Tutor</h3>
            <p>Start a new session or ask a question to begin.</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-sm ${msg.role === 'user' ? 'bg-primary text-white ml-auto rounded-tr-sm' : 'bg-surface border border-border mr-auto rounded-tl-sm'}`}>
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <Markdown content={msg.content} />
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-surface border border-border max-w-[85%] rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-bg border-t border-border">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center absolute -top-10 left-0 space-x-2">
             <button type="button" onClick={onGetHint} disabled={isLoading || messages.length === 0} className="text-xs bg-surface-2 hover:bg-surface border border-border px-3 py-1.5 rounded-full text-subtle hover:text-white transition-colors disabled:opacity-50">
               💡 Get Hint
             </button>
             <button type="button" onClick={onGetSolution} disabled={isLoading || messages.length === 0} className="text-xs bg-surface-2 hover:bg-surface border border-border px-3 py-1.5 rounded-full text-subtle hover:text-white transition-colors disabled:opacity-50">
               🔑 Solution
             </button>
          </div>
          <div className="relative flex items-center tour-chat-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about the problem..."
              className="w-full bg-surface border border-border rounded-xl py-4 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/50 text-text placeholder-subtle shadow-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:hover:bg-primary transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
