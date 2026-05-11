'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Chat } from '@/components/Chat';

import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  ExternalLink, 
  Cpu, 
  Key as KeyIcon, 
  LogOut, 
  X, 
  ChevronRight, 
  Globe,
  Loader2,
  Sparkles
} from 'lucide-react';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [problemDetails, setProblemDetails] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    fetchUser();

    const cachedSessions = localStorage.getItem('thread_cache');
    if (cachedSessions) {
      try {
        setSessions(JSON.parse(cachedSessions));
      } catch (e) {
        console.error('Failed to parse cached threads', e);
      }
    }

    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/conversations');
        if (res.ok) {
          const data = await res.json();
          setSessions(data.conversations || []);
          localStorage.setItem('thread_cache', JSON.stringify(data.conversations || []));
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
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) {
                assistantResponse += data.chunk;
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1].content = assistantResponse;
                  return newMsgs;
                });
              }
            } catch (e) {}
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

      setSessions((prev) => {
        const updated = [{id: startData.session_id, title: startData.problem_title, created_at: new Date().toISOString()}, ...prev];
        localStorage.setItem('thread_cache', JSON.stringify(updated));
        return updated;
      });

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

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="flex h-[100dvh] bg-bg text-text font-sans overflow-hidden">
      {/* Sidebar */}
      <div 
        className={`h-full shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
          isSidebarOpen ? 'w-[280px]' : 'w-0'
        }`}
      >
        <div className="w-[280px] h-full">
          <Sidebar
            userEmail={userEmail}
            conversations={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={loadSession}
            onNewSession={() => setShowNewModal(true)}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 h-full flex flex-col min-w-0 relative bg-bg">
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-surface/50 backdrop-blur-md shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl hover:bg-surface-2 text-text-muted hover:text-text transition-all active:scale-90"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="h-6 w-px bg-border mx-1" />
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight">Codeforces AI</h1>
                {currentSessionId && problemDetails && (
                  <p className="text-[10px] text-text-subtle uppercase tracking-widest font-bold">
                    Current Session
                  </p>
                )}
              </div>
            </div>

            {currentSessionId && problemDetails && (
              <button
                onClick={() => window.open(problemDetails.url, 'popup', 'width=800,height=600')}
                className="ml-2 group flex items-center gap-2 text-xs font-medium bg-surface-2 hover:bg-surface-3 border border-border rounded-lg px-3 py-1.5 transition-all"
              >
                <span className="truncate max-w-[150px]">{problemDetails.title}</span>
                <ExternalLink className="w-3 h-3 text-text-subtle group-hover:text-primary transition-colors" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-surface-2 border border-border rounded-xl px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-transparent border-none text-[13px] font-medium focus:outline-none text-text cursor-pointer pr-1"
              >
                {MODELS.map(m => (
                  <option key={m.id} value={m.id} className="bg-surface-2">{m.name}</option>
                ))}
              </select>
            </div>

            <div className="h-6 w-px bg-border mx-1" />

            <button
              onClick={() => window.location.href = '/setup-key'}
              className="p-2 text-text-muted hover:text-text hover:bg-surface-2 rounded-xl transition-all"
              title="API Settings"
            >
              <KeyIcon className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleLogout}
              className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition-all"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 w-full flex overflow-hidden relative">
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
      <AnimatePresence>
        {showNewModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowNewModal(false); setError(''); }}
              className="absolute inset-0 bg-bg/80 backdrop-blur-xl"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-surface border border-border shadow-2xl rounded-3xl w-full max-w-xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold tracking-tight">Extract Problem</h3>
                      <p className="text-text-muted text-sm">Enter a Codeforces URL to begin</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setShowNewModal(false); setError(''); }}
                    className="p-2 hover:bg-surface-2 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-text-subtle" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="relative group">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://codeforces.com/contest/..."
                      className="w-full bg-surface-2 border border-border group-focus-within:border-primary/50 rounded-2xl px-5 py-4 text-text placeholder-text-subtle focus:outline-none transition-all pr-12"
                      autoFocus
                      disabled={isLoading}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <ChevronRight className="w-5 h-5 text-text-subtle group-focus-within:text-primary transition-colors" />
                    </div>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-danger text-sm bg-danger/10 p-4 rounded-2xl border border-danger/20 flex items-center gap-3"
                    >
                      <X className="w-4 h-4 shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => { setShowNewModal(false); setError(''); }}
                      className="px-6 py-3 rounded-2xl text-sm font-semibold hover:bg-surface-2 transition-colors disabled:opacity-50"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleNewSession}
                      disabled={!urlInput || isLoading}
                      className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-primary/25 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Extracting...</span>
                        </>
                      ) : (
                        <>
                          <span>Start Session</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
