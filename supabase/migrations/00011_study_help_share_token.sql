-- Add share_token column for shareable study sets
ALTER TABLE public.study_help_sessions
  ADD COLUMN share_token TEXT UNIQUE DEFAULT NULL;

CREATE INDEX idx_study_help_sessions_share_token
  ON public.study_help_sessions(share_token);

-- Allow anyone (including unauthenticated users) to read sessions that have a share token
CREATE POLICY "Anyone can view shared study_help_sessions"
  ON public.study_help_sessions FOR SELECT
  USING (share_token IS NOT NULL);
