'use client'
import React, { useState } from 'react';
import { Terminal, Cpu, FolderOpen, PlaySquare } from 'lucide-react';

export default function RetroTerminalDesign() {
  const [messages, setMessages] = useState([
    { role: 'user', content: "Analyze problem 1542C" },
    { role: 'assistant', content: "Analysis complete.<br/><br/>Target: Compute sum of f(i) modulo 10^9+7.<br/>Definition: f(i) = min x > 0 where x does not divide i.<br/><br/>SUGGESTION: Determine the condition for f(i) > k." },
    { role: 'user', content: "For f(i) to be > k, i must be divisible by all integers from 1 to k." },
    { role: 'assistant', content: "Correct. <br/>Therefore, i must be a multiple of LCM(1, 2, ..., k).<br/>How many such integers exist in the range [1, n]?" }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: "PROCESSING...<br/>That is an insightful observation. You should divide n by the LCM." }]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#00FF41] font-mono p-4 flex flex-col uppercase">
      <div className="flex justify-between items-center border-b border-[#00FF41] pb-2 mb-4 text-sm">
        <div className="flex gap-6">
          <span className="cursor-pointer hover:bg-[#00FF41] hover:text-black px-2">SYSTEM</span>
          <span className="cursor-pointer hover:bg-[#00FF41] hover:text-black px-2">MODULES</span>
          <span className="cursor-pointer hover:bg-[#00FF41] hover:text-black px-2">HELP</span>
        </div>
        <div>TUTOR_NODE v1.0.9 // ONLINE</div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        <aside className="w-64 border border-[#00FF41] flex flex-col">
          <div className="bg-[#00FF41] text-black px-2 py-1 font-bold flex items-center gap-2">
            <FolderOpen className="w-4 h-4" /> DIRECTORY
          </div>
          <div className="p-4 space-y-2 text-sm flex-1 overflow-y-auto">
            <div className="hover:bg-[#00FF41]/20 cursor-pointer p-1">./problems/1542C.sys</div>
            <div className="hover:bg-[#00FF41]/20 cursor-pointer p-1">./problems/295A.sys</div>
            <div className="hover:bg-[#00FF41]/20 cursor-pointer p-1 text-[#00FF41]/50">./cache/temp.log</div>
          </div>
          <div className="border-t border-[#00FF41] p-2 text-xs">
            <div>MEM: 640K OK</div>
            <div>CPU: <Cpu className="w-3 h-3 inline animate-pulse" /> ACTIVE</div>
          </div>
        </aside>

        <main className="flex-1 border border-[#00FF41] flex flex-col relative">
          <div className="bg-[#00FF41] text-black px-2 py-1 font-bold flex items-center justify-between">
            <div className="flex items-center gap-2"><Terminal className="w-4 h-4" /> COMM_LINK_ESTABLISHED</div>
            <div>[PID: 3942]</div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-6 mb-12">
            <div className="opacity-70">
              Initializing connection...<br/>
              Loading problem parameters... OK<br/>
              Awaiting input...
            </div>

            {messages.map((msg, idx) => (
              <div key={idx} className={msg.role === 'assistant' ? "pl-4 border-l-2 border-[#00FF41]/30" : ""}>
                <span className={msg.role === 'assistant' ? "text-[#FFB000]" : "text-white"}>
                  {msg.role === 'assistant' ? 'TUTOR_SYS>' : 'root@user:~$'}
                </span>{' '}
                <span dangerouslySetInnerHTML={{ __html: msg.content }} />
              </div>
            ))}

            <div>
              <span className="text-white">root@user:~$</span> <span className="inline-block w-2 h-4 bg-[#00FF41] animate-pulse align-middle"></span>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full p-2 border-t border-[#00FF41] flex gap-2 items-center bg-black">
             <span className="text-white">root@user:~$</span>
             <input
               type="text"
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
               className="flex-1 bg-transparent border-none outline-none text-[#00FF41] uppercase"
               autoFocus
             />
             <button onClick={handleSend} aria-label="Execute" className="hover:bg-[#00FF41] hover:text-black p-1 border border-[#00FF41]">
               <PlaySquare className="w-4 h-4" />
             </button>
          </div>
        </main>
      </div>
    </div>
  );
}
