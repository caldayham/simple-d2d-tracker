-- Canvassing Companion Database Schema
-- Run this migration via the Supabase Dashboard SQL editor or `supabase db push`
-- after setting up your Supabase project.

CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  ended_at TIMESTAMPTZ,
  notes TEXT
);

CREATE TABLE visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  audio_path TEXT,
  audio_mime_type TEXT,
  audio_duration_seconds INTEGER,
  transcript TEXT,
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User owns sessions"
  ON sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "User owns visits via session"
  ON visits FOR ALL
  USING (session_id IN (
    SELECT id FROM sessions WHERE user_id = auth.uid()
  ));
