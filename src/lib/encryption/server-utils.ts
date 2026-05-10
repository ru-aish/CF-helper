import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/encryption'

export async function getUserApiKey(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('user_keys')
    .select('encrypted_key')
    .eq('user_id', user.id)
    .single()

  if (error || !data?.encrypted_key) {
    // If we're enforcing custom keys, throw error here.
    // As a fallback for dev, we can return the ENV key, but since you want it from the user:
    if (process.env.GEMINI_API_KEY) {
      console.warn('User has no API key, falling back to GEMINI_API_KEY from environment')
      return process.env.GEMINI_API_KEY
    }
    throw new Error('User has no API key setup')
  }

  return decrypt(data.encrypted_key)
}
