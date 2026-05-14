import React from 'react';
import { Send, Star, Zap, Activity } from 'lucide-react';

// Design 5: Gamified & Playful
// Soft rounded corners, thick strokes, bubbly UI, vibrant friendly colors, floating elements.

export default function GamifiedDesign() {
  return (
    <div className="min-h-screen bg-[#F0F8FF] font-sans overflow-hidden flex flex-col relative">

      {/* Playful background elements */}
      <div className="absolute top-10 right-20 w-32 h-32 bg-[#FFB6C1] rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
      <div className="absolute top-40 left-20 w-32 h-32 bg-[#98FB98] rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/2 w-40 h-40 bg-[#87CEFA] rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-4000"></div>

      {/* Header */}
      <header className="px-8 py-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-[30px] border-[3px] border-[#E2E8F0] shadow-sm">
          <div className="bg-[#FF9F43] p-2 rounded-full">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-[#2D3748] text-xl tracking-tight">TutorBot</span>
        </div>

        <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-[30px] border-[3px] border-[#E2E8F0] shadow-sm">
           <div className="flex items-center gap-2">
             <Star className="w-6 h-6 text-[#F1C40F] fill-[#F1C40F]" />
             <span className="font-black text-[#2D3748] text-lg">1,240 XP</span>
           </div>
           <div className="w-[2px] h-8 bg-[#E2E8F0]"></div>
           <div className="w-10 h-10 bg-[#A29BFE] rounded-full border-[3px] border-white ring-[3px] ring-[#E2E8F0]"></div>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col relative z-10">

        {/* Chat Area */}
        <div className="flex-1 bg-white/80 backdrop-blur-md rounded-[40px] border-[4px] border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 flex flex-col gap-6 overflow-y-auto mb-6">

          <div className="flex justify-center mb-4">
            <span className="bg-[#E2E8F0] text-[#718096] font-bold text-xs uppercase px-4 py-2 rounded-full tracking-wider">
              Level 2: Problem 1542C
            </span>
          </div>

          {/* AI Message */}
          <div className="flex gap-4 items-end">
            <div className="w-12 h-12 rounded-[20px] bg-[#00D2D3] flex items-center justify-center border-[3px] border-white shadow-sm pb-1">
              <BotIcon className="w-6 h-6 text-white" />
            </div>
            <div className="bg-[#F1F2F6] text-[#2D3748] px-6 py-4 rounded-[24px] rounded-bl-sm font-medium text-[15px] border-[2px] border-[#E2E8F0] shadow-sm max-w-[80%]">
              Great job! You found the pattern. Now, how do we sum this up efficiently for a very large N?
            </div>
          </div>

          {/* User Message */}
          <div className="flex gap-4 items-end flex-row-reverse">
             <div className="w-12 h-12 rounded-[20px] bg-[#FF9F43] flex items-center justify-center border-[3px] border-white shadow-sm pb-1">
               <span className="font-bold text-white text-lg">U</span>
             </div>
             <div className="bg-[#0984E3] text-white px-6 py-4 rounded-[24px] rounded-br-sm font-medium text-[15px] shadow-md max-w-[80%]">
               Maybe we can group the numbers that have the same value for f(i)?
             </div>
          </div>

        </div>

        {/* Input Area */}
        <div className="bg-white rounded-[32px] p-2 pr-3 flex items-center shadow-[0_10px_40px_rgba(0,0,0,0.08)] border-[3px] border-white">
           <button aria-label="Activity" className="w-12 h-12 flex items-center justify-center text-[#A0AEC0] hover:text-[#0984E3] hover:bg-[#F1F2F6] rounded-full transition-colors ml-1">
             <Activity className="w-6 h-6" />
           </button>
           <input
             type="text"
             placeholder="Type your answer..."
             className="flex-1 bg-transparent border-none outline-none px-4 text-[#2D3748] font-medium placeholder-[#A0AEC0] text-[16px]"
           />
           <button aria-label="Send message" className="bg-[#00D2D3] hover:bg-[#00b8b9] text-white p-4 rounded-[24px] shadow-sm transition-transform active:scale-95 flex items-center gap-2 font-bold px-6">
             <span>Send</span>
             <Send className="w-5 h-5" />
           </button>
        </div>

      </main>
    </div>
  );
}

function BotIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  );
}
