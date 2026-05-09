import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encrypt, decrypt } from '@/lib/encryption'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use the supabase admin client (if we bypass RLS for this backend route) or simply fetch via standard client
  // Assuming RLS is set up properly allowing users to select their own key.
  const { data, error } = await supabase
    .from('user_keys')
    .select('encrypted_key')
    .eq('user_id', user.id)
    .single()

  if (error || !data?.encrypted_key) {
    return NextResponse.json({ hasKey: false })
  }

  // We don't return the decrypted key to the frontend for security!
  // We just confirm they have one.
  return NextResponse.json({ hasKey: true })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { apiKey } = await req.json()

  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    return NextResponse.json({ error: 'API key is required' }, { status: 400 })
  }

  try {
    const encryptedKey = encrypt(apiKey.trim())

    const { error } = await supabase
      .from('user_keys')
      .upsert({
        user_id: user.id,
        encrypted_key: encryptedKey,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (error) {
      console.error('Error saving API key to Supabase:', error)
      return NextResponse.json({ error: 'Failed to save API key' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Encryption error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
