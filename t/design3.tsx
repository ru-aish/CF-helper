import React from 'react';
import { Terminal, Cpu, FolderOpen, PlaySquare } from 'lucide-react';

// Design 3: Retro Terminal / IDE
// Designed for hardcore programmers. Monospaced fonts, green/amber on black, sharp borders.

export default function RetroTerminalDesign() {
  return (
    <div className="min-h-screen bg-[#000000] text-[#00FF41] font-mono p-4 flex flex-col uppercase">
      {/* Top Menu Bar */}
      <div className="flex justify-between items-center border-b border-[#00FF41] pb-2 mb-4 text-sm">
        <div className="flex gap-6">
          <span className="cursor-pointer hover:bg-[#00FF41] hover:text-black px-2">SYSTEM</span>
          <span className="cursor-pointer hover:bg-[#00FF41] hover:text-black px-2">MODULES</span>
          <span className="cursor-pointer hover:bg-[#00FF41] hover:text-black px-2">HELP</span>
        </div>
        <div>TUTOR_NODE v1.0.9 // ONLINE</div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* File Explorer / Stats */}
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

        {/* Main Terminal Chat */}
        <main className="flex-1 border border-[#00FF41] flex flex-col relative">
          <div className="bg-[#00FF41] text-black px-2 py-1 font-bold flex items-center justify-between">
            <div className="flex items-center gap-2"><Terminal className="w-4 h-4" /> COMM_LINK_ESTABLISHED</div>
            <div>[PID: 3942]</div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="opacity-70">
              Initializing connection...<br/>
              Loading problem parameters... OK<br/>
              Awaiting input...
            </div>

            <div>
              <span className="text-white">root@user:~$</span> Analyze problem 1542C
            </div>

            <div className="pl-4 border-l-2 border-[#00FF41]/30">
              <span className="text-[#FFB000]">TUTOR_SYS&gt;</span> Analysis complete.<br/><br/>
              Target: Compute sum of f(i) modulo 10^9+7.<br/>
              Definition: f(i) = min x &gt; 0 where x does not divide i.<br/><br/>
              SUGGESTION: Determine the condition for f(i) &gt; k.
            </div>

            <div>
              <span className="text-white">root@user:~$</span> For f(i) to be &gt; k, i must be divisible by all integers from 1 to k.
            </div>

            <div className="pl-4 border-l-2 border-[#00FF41]/30">
              <span className="text-[#FFB000]">TUTOR_SYS&gt;</span> Correct. <br/>
              Therefore, i must be a multiple of LCM(1, 2, ..., k).<br/>
              How many such integers exist in the range [1, n]?
            </div>

            {/* Blinking Cursor */}
            <div>
              <span className="text-white">root@user:~$</span> <span className="inline-block w-2 h-4 bg-[#00FF41] animate-pulse align-middle"></span>
            </div>
          </div>

          {/* Hidden real input field to capture typing */}
          <div className="absolute bottom-0 left-0 w-full p-2 border-t border-[#00FF41] flex gap-2 items-center bg-black">
             <span className="text-white">root@user:~$</span>
             <input type="text" className="flex-1 bg-transparent border-none outline-none text-[#00FF41] uppercase" autoFocus />
             <button aria-label="Execute" className="hover:bg-[#00FF41] hover:text-black p-1 border border-[#00FF41]">
               <PlaySquare className="w-4 h-4" />
             </button>
          </div>
        </main>
      </div>
    </div>
  );
}
