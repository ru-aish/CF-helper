import { useState, useRef, useEffect } from 'react';
import { Markdown } from './Markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Lightbulb, Key, Bot, User, Sparkles, Command } from 'lucide-react';

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
    <div className="flex flex-col h-full w-full bg-bg relative">
      {/* Messages Area */}
      <div className="flex-1 w-full flex flex-col overflow-y-auto custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8 space-y-6">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full" />
              <div className="relative w-20 h-20 bg-surface-2 border border-border rounded-3xl flex items-center justify-center shadow-2xl">
                <Bot className="w-10 h-10 text-primary" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-secondary rounded-full flex items-center justify-center border-4 border-bg shadow-lg">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-bold tracking-tight text-gradient">How can I help you today?</h3>
              <p className="text-text-muted max-w-md mx-auto leading-relaxed">
                I&apos;m your Codeforces AI Tutor. Paste a problem URL to start, or ask me anything about competitive programming.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg mt-8">
               {[
                 "Explain time complexity",
                 "How to use Segment Trees?",
                 "Debug my C++ code",
                 "Tips for Div. 2 contests"
               ].map((suggestion) => (
                 <button 
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="p-4 bg-surface-2 border border-border rounded-2xl text-sm font-medium text-text-muted hover:text-text hover:bg-surface-3 hover:border-primary/30 transition-all text-left flex items-center gap-3 group"
                 >
                   <div className="w-8 h-8 rounded-lg bg-bg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                     <Command className="w-4 h-4" />
                   </div>
                   {suggestion}
                 </button>
               ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full space-y-8 px-4 md:px-8 py-8">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white' 
                      : 'bg-surface-2 border border-border text-primary'
                  }`}>
                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  
                  <div className={`max-w-[80%] space-y-2`}>
                    <div className={`px-5 py-4 rounded-3xl shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-surface-2 border border-border text-text rounded-tr-none' 
                        : 'bg-surface-3 border border-border/50 text-text rounded-tl-none'
                    }`}>
                      {msg.role === 'user' ? (
                        <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                      ) : (
                        <div className="prose prose-invert prose-p:leading-relaxed prose-pre:my-4">
                          <Markdown content={msg.content} />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        
        {isLoading && (
          <div className="max-w-4xl mx-auto w-full flex gap-4 px-4 md:px-8">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary animate-pulse" />
            </div>
            <div className="bg-surface-3 border border-border/50 rounded-3xl rounded-tl-none px-6 py-4 flex items-center gap-1.5 shadow-sm">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-duration:0.8s]"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="w-full px-4 md:px-8 pb-8 pt-2 bg-gradient-to-t from-bg via-bg to-transparent">
        <div className="max-w-4xl mx-auto">
          {/* Quick Actions */}
          <AnimatePresence>
            {messages.length > 0 && !isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center gap-2 mb-4 ml-1"
              >
                 <button 
                  onClick={onGetHint} 
                  className="flex items-center gap-1.5 text-xs bg-surface-2 hover:bg-surface-3 border border-border px-4 py-2 rounded-full text-text-muted hover:text-primary transition-all shadow-sm hover:shadow-primary/5 group"
                 >
                   <Lightbulb className="w-3.5 h-3.5 text-warning group-hover:scale-110 transition-transform" />
                   <span>Get Hint</span>
                 </button>
                 <button 
                  onClick={onGetSolution} 
                  className="flex items-center gap-1.5 text-xs bg-surface-2 hover:bg-surface-3 border border-border px-4 py-2 rounded-full text-text-muted hover:text-secondary transition-all shadow-sm hover:shadow-secondary/5 group"
                 >
                   <Key className="w-3.5 h-3.5 text-secondary group-hover:scale-110 transition-transform" />
                   <span>View Solution</span>
                 </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 blur opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative flex items-center bg-surface-2 border border-border group-focus-within:border-primary/50 rounded-2xl transition-all shadow-xl">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message your tutor..."
                className="w-full bg-transparent py-5 pl-6 pr-14 text-text placeholder-text-subtle focus:outline-none"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`absolute right-3 p-3 rounded-xl transition-all duration-300 ${
                  input.trim() && !isLoading 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95' 
                    : 'bg-surface-3 text-text-subtle'
                }`}
              >
                <Send className={`w-5 h-5 ${input.trim() && !isLoading ? 'animate-in' : ''}`} />
              </button>
            </div>
            <p className="text-[10px] text-text-subtle mt-3 text-center opacity-60">
              Press <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface-3 text-[9px] uppercase">Enter</kbd> to send
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
