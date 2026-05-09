'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Chat } from '@/components/Chat';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-flash-lite');

  const MODELS = [
    { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro' },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash' },
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite' },
    { id: 'gemini-2.5-pro-latest', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.5-flash-latest', name: 'Gemini 2.5 Flash' },
  ];

  const handleSendMessage = async (content: string) => {
    if (!currentSessionId) return;

    const userMsg: Message = { role: 'user', content };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: currentSessionId, message: content, model: selectedModel }),
      });

      if (!res.ok) throw new Error('Failed to send message');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.chunk) {
              assistantResponse += data.chunk;
              setMessages((prev) => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1].content = assistantResponse;
                return newMsgs;
              });
            } else if (data.error) {
               console.error("Chat Error:", data.error);
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSession = async () => {
    setError('');
    setIsLoading(true);
    try {
      const extractRes = await fetch('/api/extract-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput })
      });

      const extractData = await extractRes.json();
      if (!extractRes.ok) throw new Error(extractData.error || 'Failed to extract problem');

      const startRes = await fetch('/api/start-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem_id: extractData.problem_id })
      });

      const startData = await startRes.json();
      if (!startRes.ok) throw new Error(startData.error || 'Failed to start session');

      setCurrentSessionId(startData.session_id);
      setMessages([{ role: 'assistant', content: startData.welcome_message }]);
      setShowNewModal(false);
      setUrlInput('');

      // Add to session list optimistically
      setSessions((prev) => [{id: startData.session_id, title: startData.problem_title}, ...prev]);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSession = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/session/${id}/history`);
      const data = await res.json();
      if (res.ok) {
        setCurrentSessionId(id);
        setMessages(data.conversation_history.map((msg: any) => ({
          role: msg.role,
          content: msg.message
        })));
      }
    } catch (e) {
      console.error("Error loading session", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetHint = async () => {
    if (!currentSessionId) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/get-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: currentSessionId, model: selectedModel }),
      });
      const data = await res.json();
      if (res.ok && data.hint) {
         setMessages(prev => [...prev, {role: 'assistant', content: data.hint}]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetSolution = async () => {
    if (!currentSessionId) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/get-solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: currentSessionId, model: selectedModel }),
      });
      const data = await res.json();
      if (res.ok && data.solution) {
         setMessages(prev => [...prev, {role: 'assistant', content: data.solution}]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex h-screen bg-bg text-text font-sans overflow-hidden">
      <Sidebar
        conversations={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={loadSession}
        onNewSession={() => setShowNewModal(true)}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-surface shrink-0">
          <h1 className="text-sm font-semibold tracking-wide">Codeforces AI Tutor</h1>
          <div>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-surface-2 border border-border text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary text-text"
            >
              {MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </header>
        <div className="flex-1 overflow-hidden relative">
           <Chat
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onGetHint={handleGetHint}
            onGetSolution={handleGetSolution}
           />
        </div>
      </main>

      {/* New Problem Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl w-full max-w-md overflow-hidden border border-border shadow-2xl">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Start New Problem</h3>
              <p className="text-subtle text-sm mb-6">Enter a Codeforces problem URL to begin a tutoring session.</p>

              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://codeforces.com/contest/2135/problem/C"
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text placeholder-subtle mb-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
                disabled={isLoading}
              />

              {error && <div className="text-danger text-sm mb-4 bg-danger/10 p-3 rounded-lg border border-danger/20">{error}</div>}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => { setShowNewModal(false); setError(''); }}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-surface-2 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleNewSession}
                  disabled={!urlInput || isLoading}
                  className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Extracting...
                    </>
                  ) : 'Start Session'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
