'use client'
import React, { useState } from 'react';
import { Send, Menu, CheckCircle2, Circle } from 'lucide-react';

export default function MinimalistDesign() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Let's start by calculating $f(i)$ for the first few integers to see if we can spot a pattern. What do you get for $i = 1, 2, 3, 4$?" },
    { role: 'user', content: "For 1 it's 2. For 2 it's 3. For 3 it's 2. For 4 it's 3." }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: "Good. Now calculate it for 5, 6, 7, and 8. See any repeating structure or relation to LCM?" }]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-serif flex">
      <div className="w-1/2 border-r border-zinc-200 bg-white overflow-y-auto">
        <div className="max-w-2xl mx-auto p-12 lg:p-20">
          <div className="flex items-center gap-3 mb-8 text-zinc-500 font-sans text-sm tracking-widest uppercase">
            <span>Codeforces</span>
            <span>•</span>
            <span>Problem 1542C</span>
          </div>
          <h1 className="text-4xl font-normal leading-tight mb-8">Strange Function</h1>
          <div className="prose prose-zinc prose-lg">
            <p>Let $f(i)$ denote the minimum positive integer $x$ such that $x$ is not a divisor of $i$.</p>
            <p>Compute {"$\\sum_{i=1}^n f(i)$"} modulo {"$10^9+7$"}.</p>
            <div className="my-10 border-l-2 border-zinc-900 pl-6 py-2">
              <h3 className="text-sm font-sans font-bold uppercase tracking-wider text-zinc-400 mb-4">Task Checklist</h3>
              <ul className="list-none p-0 m-0 space-y-3 font-sans text-sm">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-zinc-900" /> Understand the definition of f(i)</li>
                <li className="flex items-center gap-3 text-zinc-500"><Circle className="w-5 h-5" /> Find the pattern for small values</li>
                <li className="flex items-center gap-3 text-zinc-500"><Circle className="w-5 h-5" /> Optimize for large n</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="w-1/2 flex flex-col bg-[#F4F4F5]">
        <header className="h-16 flex items-center justify-end px-8 font-sans">
          <button aria-label="Menu" className="text-zinc-400 hover:text-zinc-900 transition-colors">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-12 lg:px-20 py-8 font-sans">
           <div className="max-w-xl mx-auto space-y-12">
             {messages.map((msg, idx) => (
               <div key={idx}>
                 <div className={`text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3 ${msg.role === 'user' ? 'text-right' : ''}`}>
                   {msg.role === 'user' ? 'You' : 'Tutor'}
                 </div>
                 <div className={`text-lg leading-relaxed ${msg.role === 'user' ? 'text-zinc-900 text-right bg-white p-6 rounded-sm shadow-sm border border-zinc-100' : 'text-zinc-700'}`}>
                   {msg.content}
                 </div>
               </div>
             ))}
           </div>
        </div>

        <div className="p-8 lg:px-20 font-sans bg-white border-t border-zinc-200">
          <div className="max-w-xl mx-auto">
            <div className="flex items-end gap-4">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="flex-1 bg-transparent border-b-2 border-zinc-200 focus:border-zinc-900 outline-none resize-none py-2 text-lg text-zinc-900 placeholder-zinc-400 transition-colors min-h-[40px] max-h-[200px]"
                placeholder="Write your thoughts..."
                rows={1}
              />
              <button onClick={handleSend} aria-label="Send message" className="mb-2 text-zinc-400 hover:text-zinc-900 transition-colors">
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
