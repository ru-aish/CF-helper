import React from 'react';
import Link from 'next/link';

export default function DesignIndex() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-10 font-sans">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Design Explorations</h1>
        <p className="text-gray-400 mb-10">Select a design concept below to preview the UI endpoints.</p>

        <div className="grid gap-6 md:grid-cols-2">
          <Link href="/t/design1" className="block p-6 rounded-2xl bg-gray-800 border border-gray-700 hover:border-indigo-500 transition-colors group">
            <h2 className="text-2xl font-semibold mb-2 group-hover:text-indigo-400">Design 1: Glassmorphism</h2>
            <p className="text-gray-400 text-sm">Deep space aesthetic with translucent surfaces and glowing accents.</p>
          </Link>

          <Link href="/t/design2" className="block p-6 rounded-2xl bg-gray-800 border border-gray-700 hover:border-zinc-300 transition-colors group">
            <h2 className="text-2xl font-semibold mb-2 group-hover:text-zinc-300">Design 2: Minimalist Split-pane</h2>
            <p className="text-gray-400 text-sm">Focuses on readability, clean typography, and a textbook-like feel.</p>
          </Link>

          <Link href="/t/design3" className="block p-6 rounded-2xl bg-gray-800 border border-gray-700 hover:border-green-500 transition-colors group">
            <h2 className="text-2xl font-semibold mb-2 group-hover:text-green-500">Design 3: Retro Terminal IDE</h2>
            <p className="text-gray-400 text-sm">Hardcore programmer style with green-on-black monospaced terminal UI.</p>
          </Link>

          <Link href="/t/design4" className="block p-6 rounded-2xl bg-gray-800 border border-gray-700 hover:border-yellow-400 transition-colors group">
            <h2 className="text-2xl font-semibold mb-2 group-hover:text-yellow-400">Design 4: Neo-Brutalism</h2>
            <p className="text-gray-400 text-sm">Bold, high-contrast flat UI with harsh shadows and stark borders.</p>
          </Link>

          <Link href="/t/design5" className="block p-6 rounded-2xl bg-gray-800 border border-gray-700 hover:border-blue-400 transition-colors group">
            <h2 className="text-2xl font-semibold mb-2 group-hover:text-blue-400">Design 5: Gamified Playful</h2>
            <p className="text-gray-400 text-sm">Bubbly rounded cards, vibrant accents, and floating friendly elements.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
