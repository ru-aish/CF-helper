'use client'

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { Bot, LogIn, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [otp, setOtp] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [resendTimer, setResendTimer] = useState(0)

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
        setShowOtpInput(false) // Keep them on the email screen if initial send fails
      }
    } else {
      setShowOtpInput(true)
      setResendTimer(60) // 60 second cooldown
      setIsLoading(false)
      if (isResend) {
        setErrorMsg('Code resent successfully.')
        setTimeout(() => setErrorMsg(''), 3000) // Clear success message after 3 seconds
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
      console.error('Error verifying OTP:', error.message)
      // Special handling for expired/invalid tokens
      if (error.message.toLowerCase().includes('expired') || error.message.toLowerCase().includes('invalid')) {
        setErrorMsg('The code is invalid or has expired. Please request a new one.')
      } else {
        setErrorMsg(error.message)
      }
      setIsLoading(false)
    } else {
      // Setup successful, redirect happens automatically or we can force it
      window.location.href = '/'
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 shadow-inner">
            <Bot size={32} />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Codeforces AI Tutor
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {showOtpInput ? "Check your email for the verification code" : "Sign in to start learning and tracking your progress"}
          </p>
        </div>

        {errorMsg && (
          <div className={`rounded-md p-4 text-sm ${errorMsg.includes('successfully') ? 'bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-200' : 'bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-200'}`}>
            {errorMsg}
          </div>
        )}

        <div className="mt-8 space-y-6">
          {!showOtpInput ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 sm:text-sm transition-all"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !email}
                className="flex w-full justify-center rounded-lg border border-transparent bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-gray-800 transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    Sending...
                  </span>
                ) : 'Continue with Email'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    6-digit code
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Sent to {email}</span>
                </div>
                <input
                  id="otp"
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  maxLength={6}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-3xl tracking-[0.5em] font-mono text-gray-900 placeholder-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 transition-all"
                  placeholder="••••••"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="flex w-full justify-center rounded-lg border border-transparent bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-gray-800 transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    Verifying...
                  </span>
                ) : 'Verify Code'}
              </button>

              <div className="flex flex-col space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || isLoading}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 disabled:text-gray-400 dark:text-blue-400 dark:hover:text-blue-300 dark:disabled:text-gray-500 transition-colors"
                >
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpInput(false)
                    setOtp('')
                    setErrorMsg('')
                  }}
                  className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Use a different email
                </button>
              </div>
            </form>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            type="button"
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0 disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600 transition-all"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  )
}
