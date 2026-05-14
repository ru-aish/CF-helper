'use client'
import React, { useState } from 'react';
import { Send, Menu, Bot, User, Code2 } from 'lucide-react';

export default function GlassmorphismDesign() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I see you're working on a dynamic programming problem. What specific part are you stuck on?" },
    { role: 'user', content: "I can't figure out the state transitions for the subproblems." }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: "Let's break down the state. What parameters do you need to define a unique subproblem state?" }]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#050510] text-slate-200 font-sans relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-fuchsia-600/10 blur-[150px] pointer-events-none" />

      <div className="flex h-screen relative z-10 p-4 gap-4">
        <aside className="w-80 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          <div className="p-6 border-b border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">CF Tutor AI</h1>
          </div>
          <div className="flex-1 p-4 space-y-2 overflow-y-auto">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 pl-2">Recent Problems</div>
            {[1, 2, 3].map((i) => (
              <button key={i} aria-label={`Problem ${i}`} className="w-full text-left p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all group flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-sm text-slate-200">DP Optimization</div>
                  <div className="text-xs text-slate-500 mt-0.5">2 hours ago</div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-white/5">
             <div className="flex items-center gap-3">
               <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-medium border border-white/5">Problem: 1542C</span>
             </div>
             <button aria-label="Menu" className="p-2 rounded-full hover:bg-white/10 transition-colors">
               <Menu className="w-5 h-5 text-slate-400" />
             </button>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                 <div className={`w-10 h-10 rounded-2xl flex flex-shrink-0 items-center justify-center ${msg.role === 'user' ? 'bg-fuchsia-500 shadow-lg shadow-fuchsia-500/30' : 'bg-indigo-500/20 border border-indigo-500/30'}`}>
                   {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-indigo-400" />}
                 </div>
                 <div className={`rounded-2xl p-5 text-sm leading-relaxed backdrop-blur-sm ${msg.role === 'user' ? 'bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 border border-fuchsia-500/30 rounded-tr-none text-slate-200' : 'bg-white/5 border border-white/10 rounded-tl-none text-slate-300'}`}>
                   {msg.content}
                 </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-gradient-to-t from-black/20 to-transparent">
            <div className="max-w-3xl mx-auto relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-3xl blur opacity-25 group-focus-within:opacity-50 transition duration-500"></div>
              <div className="relative bg-[#0a0a16] border border-white/10 rounded-3xl p-2 flex items-center shadow-2xl">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent border-none outline-none text-slate-200 px-4 placeholder-slate-600"
                />
                <button onClick={handleSend} aria-label="Send message" className="p-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white transition-colors shadow-lg shadow-indigo-500/25">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
