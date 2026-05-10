'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Chat } from '@/components/Chat';
import { Tour } from '@/components/Tour';

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
  const [showProblemDrawer, setShowProblemDrawer] = useState(false);
  const [problemDetails, setProblemDetails] = useState<any>(null);

  useEffect(() => {
    // Load historical sessions on mount
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/conversations');
        if (res.ok) {
          const data = await res.json();
          setSessions(data.conversations || []);
        }
      } catch (e) {
        console.error("Failed to load history", e);
      }
    };
    fetchHistory();
  }, []);

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
    setProblemDetails(null);
    try {
      const res = await fetch(`/api/session/${id}/history`);
      const data = await res.json();
      if (res.ok) {
        setCurrentSessionId(id);
        setMessages(data.conversation_history.map((msg: any) => ({
          role: msg.role,
          content: msg.message
        })));

        // Also fetch the problem details for the drawer
        const problemRes = await fetch(`/api/problem/${id}`);
        if (problemRes.ok) {
          const problemData = await problemRes.json();
          setProblemDetails(problemData.problem);
        }
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
    <>
      <Tour />
    <div className="flex h-screen bg-bg text-text font-sans overflow-hidden">
      <Sidebar
        conversations={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={loadSession}
        onNewSession={() => setShowNewModal(true)}
      />
      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-surface shrink-0 z-10">
          <div className="flex items-center space-x-4">
            <h1 className="text-sm font-semibold tracking-wide">Codeforces AI Tutor</h1>
            {currentSessionId && (
              <button
                onClick={() => setShowProblemDrawer(!showProblemDrawer)}
                className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${showProblemDrawer ? 'bg-primary/20 text-primary border-primary/30' : 'bg-surface-2 border-border text-subtle hover:text-white hover:border-border/80'}`}
              >
                {showProblemDrawer ? 'Hide Problem' : 'View Problem'}
              </button>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-surface-2 border border-border text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary text-text"
            >
              {MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <a
              href="/setup-key"
              className="text-xs font-medium text-subtle hover:text-primary transition-colors flex items-center space-x-1 tour-api-key"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              <span>API Key</span>
            </a>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative">
          {/* Main Chat Area */}
          <div className={`flex-1 overflow-hidden relative transition-all duration-300 ${showProblemDrawer ? 'mr-[400px]' : ''}`}>
             <Chat
              messages={messages}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
              onGetHint={handleGetHint}
              onGetSolution={handleGetSolution}
             />
          </div>

          {/* Problem Details Drawer */}
          <div
            className={`absolute right-0 top-0 bottom-0 w-[400px] bg-surface-2 border-l border-border transform transition-transform duration-300 ease-in-out flex flex-col ${showProblemDrawer ? 'translate-x-0' : 'translate-x-full'}`}
          >
            {problemDetails ? (
              <>
                <div className="p-4 border-b border-border bg-surface shrink-0 flex justify-between items-center">
                  <h2 className="font-bold truncate pr-2 text-white">{problemDetails.title}</h2>
                  <button onClick={() => setShowProblemDrawer(false)} className="text-subtle hover:text-white p-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
                <div className="p-5 overflow-y-auto flex-1 text-sm space-y-6">
                  <div className="flex gap-3 text-xs text-subtle font-mono">
                     {problemDetails.timeLimit && <div>⏱ {problemDetails.timeLimit}</div>}
                     {problemDetails.memoryLimit && <div>💾 {problemDetails.memoryLimit}</div>}
                  </div>

                  {problemDetails.tags && problemDetails.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {problemDetails.tags.map((tag: string, i: number) => (
                        <span key={i} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs border border-primary/20">{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="prose prose-invert prose-sm max-w-none text-text leading-relaxed">
                     <p className="whitespace-pre-wrap">{problemDetails.statement}</p>
                  </div>

                  {problemDetails.sampleInputs && problemDetails.sampleInputs.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-white border-b border-border pb-2">Sample Test Cases</h3>
                      {problemDetails.sampleInputs.map((input: string, idx: number) => (
                        <div key={idx} className="bg-[#1e1e1e] rounded-lg border border-border overflow-hidden">
                          <div className="bg-[#2d2d2d] px-3 py-1.5 text-xs font-mono text-subtle border-b border-border flex justify-between">
                            <span>Input {idx + 1}</span>
                          </div>
                          <pre className="p-3 text-xs font-mono overflow-x-auto m-0 bg-transparent text-white">{input}</pre>

                          <div className="bg-[#2d2d2d] px-3 py-1.5 text-xs font-mono text-subtle border-b border-t border-border flex justify-between">
                            <span>Output {idx + 1}</span>
                          </div>
                          <pre className="p-3 text-xs font-mono overflow-x-auto m-0 bg-transparent text-[#a6e22e]">{problemDetails.sampleOutputs?.[idx] || ''}</pre>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-4">
                    <a href={problemDetails.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-dark transition-colors inline-flex items-center text-sm font-medium">
                      View Original on Codeforces
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    </a>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-subtle text-sm">
                Loading problem details...
              </div>
            )}
          </div>
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
    </>
  );
}
