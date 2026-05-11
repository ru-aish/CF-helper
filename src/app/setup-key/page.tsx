'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, ExternalLink, CheckCircle, Loader2, ShieldCheck, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SetupKeyPage() {
  const [apiKey, setApiKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if they already have a key
    const checkKey = async () => {
      // If the user navigates here manually via the settings link, let them stay.
      // We only redirect if they just logged in and we're forcing setup.
      const isForceSetup = new URLSearchParams(window.location.search).get('force') === 'true'

      const res = await fetch('/api/user/key')
      const data = await res.json()
      if (data.hasKey && isForceSetup) {
        // Redirect to main app if they already have a key
        router.push('/')
      }
    }
    checkKey()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/user/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save API key')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/')
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center bg-bg overflow-hidden px-4">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-secondary/10 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative"
      >
        <div className="glass p-8 md:p-10 rounded-[32px] shadow-2xl border border-white/5 space-y-8">
          {/* Logo & Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
                <div className="relative w-20 h-20 bg-surface-2 border border-border rounded-3xl flex items-center justify-center shadow-2xl">
                  <KeyRound className="w-10 h-10 text-primary" />
                </div>
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-secondary rounded-full flex items-center justify-center border-4 border-surface shadow-lg"
                >
                  <ShieldCheck className="w-3 h-3 text-white" />
                </motion.div>
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight text-gradient">Secure API Key</h2>
              <p className="text-text-muted text-sm px-4 leading-relaxed">
                Provide your Gemini API Key to power the AI Tutor. Your key is encrypted and stored securely.
              </p>
            </div>
          </div>

          <div className="bg-surface-2 border border-primary/20 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 mt-0.5">
                1
              </div>
              <p className="text-sm text-text-muted font-medium">
                Get your free API key from Google AI Studio.
              </p>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap font-bold text-xs uppercase tracking-widest text-primary hover:text-primary-light flex items-center gap-1.5 transition-colors md:pl-4"
            >
              Get Key <ExternalLink size={14} />
            </a>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                 <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                  2
                </div>
                <label htmlFor="api-key" className="text-xs font-bold text-text-subtle uppercase tracking-widest">
                  Paste your API Key
                </label>
              </div>
              <div className="relative group">
                <input
                  id="api-key"
                  name="apiKey"
                  type="password"
                  required
                  className="w-full bg-surface-2 border border-border group-focus-within:border-primary/50 rounded-2xl px-5 py-4 text-text placeholder-text-subtle focus:outline-none transition-all font-mono text-sm tracking-wider"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-2xl p-4 text-sm flex items-center gap-3 bg-danger/10 border border-danger/20 text-danger"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-2xl p-4 text-sm flex items-center gap-3 bg-success/10 border border-success/20 text-success"
                >
                  <CheckCircle size={16} className="shrink-0" />
                  Key saved successfully! Redirecting...
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading || success || !apiKey.trim()}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-2xl py-4 font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-95"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Save and Continue</span>}
              {!isLoading && <ChevronRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
        
        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-text-subtle font-medium uppercase tracking-widest opacity-60">
           <ShieldCheck size={14} />
           <span>Stored securely on your device</span>
        </div>
      </motion.div>
    </div>
  )
}
