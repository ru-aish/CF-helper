'use client'

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { Bot, LogIn, ArrowLeft, Sparkles, Mail, Lock, ChevronRight, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [otp, setOtp] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [isTestUser, setIsTestUser] = useState(false)
  const [password, setPassword] = useState('')

  const supabase = createClient()

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (resendTimer > 0 && showOtpInput) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [resendTimer, showOtpInput])

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setErrorMsg('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      console.error('Error logging in:', error.message)
      setErrorMsg(error.message)
      setIsLoading(false)
    }
  }

  const sendOtp = async (isResend = false) => {
    if (!email) return

    if (email.toLowerCase() === 'test@example.com') {
      setIsTestUser(true)
      return
    }

    setIsLoading(true)
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    })

    if (error) {
      console.error('Error sending OTP:', error.message)
      setErrorMsg(error.message)
      setIsLoading(false)
      if (!isResend) {
        setShowOtpInput(false)
      }
    } else {
      setShowOtpInput(true)
      setResendTimer(60)
      setIsLoading(false)
      if (isResend) {
        setErrorMsg('Code resent successfully.')
        setTimeout(() => setErrorMsg(''), 3000)
      }
    }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    await sendOtp(false)
  }

  const handleResendOtp = async () => {
    await sendOtp(true)
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setIsLoading(true)
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Error logging in:', error.message)
      setErrorMsg(error.message)
      setIsLoading(false)
    } else {
      window.location.href = '/'
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || !email) return

    setIsLoading(true)
    setErrorMsg('')

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    if (error) {
      const fallbackAttempt = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'magiclink',
      })

      if (fallbackAttempt.error) {
        console.error('Error verifying OTP:', fallbackAttempt.error)
        setErrorMsg(`Invalid code. Please try again.`)
        setIsLoading(false)
        return
      }
    }

    window.location.href = '/'
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-bg overflow-hidden px-4">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-secondary/10 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <div className="glass p-8 md:p-10 rounded-[32px] shadow-2xl border border-white/5 space-y-8">
          {/* Logo & Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
                <div className="relative w-20 h-20 bg-surface-2 border border-border rounded-3xl flex items-center justify-center shadow-2xl">
                  <Bot className="w-10 h-10 text-primary" />
                </div>
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-secondary rounded-full flex items-center justify-center border-4 border-surface shadow-lg"
                >
                  <Sparkles className="w-3 h-3 text-white" />
                </motion.div>
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight text-gradient">Welcome back</h2>
              <p className="text-text-muted text-sm px-4">
                {showOtpInput 
                  ? "We've sent a code to your email" 
                  : "Sign in to continue your competitive programming journey"}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`rounded-2xl p-4 text-sm flex items-center gap-3 border ${
                  errorMsg.includes('successfully') 
                    ? 'bg-success/10 border-success/20 text-success' 
                    : 'bg-danger/10 border-danger/20 text-danger'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${errorMsg.includes('successfully') ? 'bg-success' : 'bg-danger'}`} />
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {isTestUser ? (
                <motion.form 
                  key="test-login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handlePasswordLogin} 
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-subtle uppercase tracking-widest ml-1">Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="w-4 h-4 text-text-subtle group-focus-within:text-primary transition-colors" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-surface-2 border border-border group-focus-within:border-primary/50 rounded-2xl pl-11 pr-4 py-4 text-text placeholder-text-subtle focus:outline-none transition-all"
                        placeholder="Enter test password"
                        autoFocus
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !password}
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-2xl py-4 font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-95"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Sign In</span>}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsTestUser(false); setPassword(''); setErrorMsg(''); }}
                    className="w-full text-center text-sm text-text-subtle hover:text-text transition-colors flex items-center justify-center gap-2 pt-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to email
                  </button>
                </motion.form>
              ) : !showOtpInput ? (
                <motion.form 
                  key="email-login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleSendOtp} 
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-subtle uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="w-4 h-4 text-text-subtle group-focus-within:text-primary transition-colors" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-surface-2 border border-border group-focus-within:border-primary/50 rounded-2xl pl-11 pr-4 py-4 text-text placeholder-text-subtle focus:outline-none transition-all"
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !email}
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-2xl py-4 font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-95"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Continue</span>}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.form>
              ) : (
                <motion.form 
                  key="otp-verify"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleVerifyOtp} 
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-xs font-bold text-text-subtle uppercase tracking-widest">Verification Code</label>
                      <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{email}</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      maxLength={6}
                      className="w-full bg-surface-2 border border-border focus:border-primary/50 rounded-2xl px-4 py-5 text-center text-3xl tracking-[0.4em] font-bold text-text placeholder-text-subtle/30 focus:outline-none transition-all"
                      placeholder="000000"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-2xl py-4 font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-95"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Verify Code</span>}
                  </button>

                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendTimer > 0 || isLoading}
                      className="text-xs font-bold text-primary hover:text-primary-light disabled:text-text-subtle transition-colors uppercase tracking-widest"
                    >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowOtpInput(false); setOtp(''); setErrorMsg(''); }}
                      className="text-xs font-bold text-text-subtle hover:text-text transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      USE DIFFERENT EMAIL
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                <span className="bg-surface-2 px-3 text-text-subtle py-1 rounded-full border border-border">
                  or
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              type="button"
              className="w-full flex items-center justify-center gap-3 rounded-2xl bg-surface-2 border border-border hover:bg-surface-3 py-4 text-sm font-bold text-text transition-all active:scale-95"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
          </div>
        </div>
        
        {/* Footer */}
        <p className="mt-8 text-center text-xs text-text-subtle font-medium uppercase tracking-widest opacity-60">
          Powered by Gemini 1.5 Pro
        </p>
      </motion.div>
    </div>
  )
}
