-- Run this SQL in your Supabase SQL Editor to create the user_keys table

CREATE TABLE IF NOT EXISTS public.user_keys (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.user_keys ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own keys
CREATE POLICY "Users can view their own keys"
  ON public.user_keys
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert/update their own keys
CREATE POLICY "Users can insert/update their own keys"
  ON public.user_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own keys"
  ON public.user_keys
  FOR UPDATE
  USING (auth.uid() = user_id);
