'use client'
import React, { useState } from 'react';
import { Send, Hash, CornerRightDown } from 'lucide-react';

export default function NeoBrutalismDesign() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Let's solve this! What is the LCM of the first few numbers?" },
    { role: 'user', content: "LCM(1) = 1\nLCM(1,2) = 2\nLCM(1,2,3) = 6\nLCM(1,2,3,4) = 12" }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: "BINGO! NOW LOOK AT HOW FAST IT GROWS. WHEN DOES IT EXCEED 10^16?" }]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#FFE55C] text-black font-sans p-6 md:p-12 selection:bg-black selection:text-white flex flex-col md:flex-row gap-8">
      <div className="md:w-1/3 flex flex-col gap-6">
        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-5xl font-black uppercase tracking-tighter mb-2">CF<br/>TUTOR</h1>
          <p className="font-bold text-lg border-t-4 border-black pt-2 mt-4">AI ASSISTANT</p>
        </div>
        <div className="bg-[#FF90E8] border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex-1">
          <h2 className="text-2xl font-black uppercase border-b-4 border-black pb-2 mb-4">Problem List</h2>
          <ul className="space-y-4">
            <li className="font-bold text-lg flex items-center gap-2 hover:translate-x-2 transition-transform cursor-pointer">
              <Hash className="w-5 h-5" /> 1542C. Strange Function
            </li>
            <li className="font-bold text-lg flex items-center gap-2 hover:translate-x-2 transition-transform cursor-pointer opacity-50">
              <Hash className="w-5 h-5" /> 295A. Greg and Array
            </li>
          </ul>
        </div>
      </div>

      <div className="md:w-2/3 bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col h-[calc(100vh-6rem)] relative overflow-hidden">
        <div className="bg-[#4D65FF] text-white border-b-4 border-black p-4 flex justify-between items-center z-10">
           <div className="font-black text-xl tracking-widest uppercase">Active Session</div>
           <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-black"></div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNlN2U3ZTciLz48L3N2Zz4=')]">
          {messages.map((msg, idx) => (
            msg.role === 'assistant' ? (
              <div key={idx} className="w-4/5 mr-auto">
                 <div className="inline-block bg-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-lg font-bold whitespace-pre-wrap">
                   {msg.content}
                 </div>
                 <CornerRightDown className="w-8 h-8 ml-4 mt-2 text-black" />
              </div>
            ) : (
              <div key={idx} className="w-4/5 ml-auto flex flex-col items-end">
                 <div className="inline-block bg-[#FFE55C] border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-lg font-bold whitespace-pre-wrap text-right">
                   {msg.content}
                 </div>
              </div>
            )
          ))}
        </div>

        <div className="p-6 bg-white border-t-4 border-black">
          <div className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-white border-4 border-black p-4 font-bold text-xl outline-none focus:shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.1)] transition-shadow placeholder-black/30"
              placeholder="SHOUT YOUR ANSWER HERE..."
            />
            <button onClick={handleSend} aria-label="Send message" className="bg-[#22C55E] hover:bg-[#16a34a] border-4 border-black px-8 flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all">
               <Send className="w-8 h-8 text-black" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
