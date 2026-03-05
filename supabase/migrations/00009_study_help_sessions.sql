-- Study help session persistence
-- Stores generated AI study materials so users can revisit them later

CREATE TABLE public.study_help_sessions (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id  UUID        REFERENCES public.courses(id) ON DELETE SET NULL,
  title      TEXT        NOT NULL,
  data       JSONB       NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.study_help_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies (same 4-policy pattern as other tables)
CREATE POLICY "Users can view own study_help_sessions"
  ON public.study_help_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study_help_sessions"
  ON public.study_help_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study_help_sessions"
  ON public.study_help_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own study_help_sessions"
  ON public.study_help_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_study_help_sessions_user_id
  ON public.study_help_sessions(user_id);

CREATE INDEX idx_study_help_sessions_course_id
  ON public.study_help_sessions(course_id);

-- Reuse existing trigger function from 00001
CREATE TRIGGER set_study_help_sessions_updated_at
  BEFORE UPDATE ON public.study_help_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
