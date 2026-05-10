'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, ExternalLink, CheckCircle } from 'lucide-react'

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <div className="w-full max-w-lg space-y-8 rounded-xl bg-white p-10 shadow-lg dark:bg-gray-800">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
            <KeyRound size={32} />
          </div>
          <h2 className="mt-6 text-2xl font-extrabold text-gray-900 dark:text-white">
            Setup Google AI Studio Key
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            To use the Codeforces AI Tutor, you need to provide your own Gemini API Key. This key is encrypted and stored securely.
          </p>
        </div>

        <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/30">
          <div className="flex">
            <div className="ml-3 flex-1 md:flex md:justify-between">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Step 1:</strong> Get your free API key from Google AI Studio.
              </p>
              <p className="mt-3 text-sm md:ml-6 md:mt-0">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whitespace-nowrap font-medium text-blue-700 hover:text-blue-600 flex items-center gap-1 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Get API Key <ExternalLink size={14} />
                </a>
              </p>
            </div>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <strong>Step 2:</strong> Paste your API Key here
            </label>
            <div className="mt-2">
              <input
                id="api-key"
                name="apiKey"
                type="password"
                required
                className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {success && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle size={16} /> Key saved successfully! Redirecting...
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || success}
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save and Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
