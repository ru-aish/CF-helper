import React from 'react';
import { Send, Menu, CheckCircle2, Circle } from 'lucide-react';

// Design 2: Minimalist Split-pane
// Focuses entirely on readability, typography, and a stark, clean interface resembling a textbook or high-end reading app.

export default function MinimalistDesign() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-serif flex">
      {/* Left Pane - Problem / Context */}
      <div className="w-1/2 border-r border-zinc-200 bg-white overflow-y-auto">
        <div className="max-w-2xl mx-auto p-12 lg:p-20">
          <div className="flex items-center gap-3 mb-8 text-zinc-500 font-sans text-sm tracking-widest uppercase">
            <span>Codeforces</span>
            <span>•</span>
            <span>Problem 1542C</span>
          </div>

          <h1 className="text-4xl font-normal leading-tight mb-8">
            Strange Function
          </h1>

          <div className="prose prose-zinc prose-lg">
            <p>
              Let $f(i)$ denote the minimum positive integer $x$ such that $x$ is not a divisor of $i$.
            </p>
            <p>
              Compute {"$\\sum_{i=1}^n f(i)$"} modulo {"$10^9+7$"}.
            </p>

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

      {/* Right Pane - Tutor Chat */}
      <div className="w-1/2 flex flex-col bg-[#F4F4F5]">
        <header className="h-16 flex items-center justify-end px-8 font-sans">
          <button aria-label="Menu" className="text-zinc-400 hover:text-zinc-900 transition-colors">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-12 lg:px-20 py-8 font-sans">
           <div className="max-w-xl mx-auto space-y-12">

             {/* AI Message */}
             <div>
               <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Tutor</div>
               <div className="text-lg text-zinc-700 leading-relaxed">
                 Let&apos;s start by calculating $f(i)$ for the first few integers to see if we can spot a pattern. What do you get for $i = 1, 2, 3, 4$?
               </div>
             </div>

             {/* User Message */}
             <div>
               <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3 text-right">You</div>
               <div className="text-lg text-zinc-900 leading-relaxed text-right bg-white p-6 rounded-sm shadow-sm border border-zinc-100">
                 For 1 it&apos;s 2. For 2 it&apos;s 3. For 3 it&apos;s 2. For 4 it&apos;s 3.
               </div>
             </div>

           </div>
        </div>

        {/* Input Area */}
        <div className="p-8 lg:px-20 font-sans bg-white border-t border-zinc-200">
          <div className="max-w-xl mx-auto">
            <div className="flex items-end gap-4">
              <textarea
                className="flex-1 bg-transparent border-b-2 border-zinc-200 focus:border-zinc-900 outline-none resize-none py-2 text-lg text-zinc-900 placeholder-zinc-400 transition-colors min-h-[40px] max-h-[200px]"
                placeholder="Write your thoughts..."
                rows={1}
              />
              <button aria-label="Send message" className="mb-2 text-zinc-400 hover:text-zinc-900 transition-colors">
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
