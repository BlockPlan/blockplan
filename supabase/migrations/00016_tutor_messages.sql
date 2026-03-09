-- Tutor chat messages for AI Tutor feature
CREATE TABLE IF NOT EXISTS tutor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES study_help_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by session
CREATE INDEX idx_tutor_messages_session ON tutor_messages(session_id, created_at);

-- RLS policies
ALTER TABLE tutor_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own tutor messages"
  ON tutor_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tutor messages"
  ON tutor_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);
