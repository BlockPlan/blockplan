-- Add optional description/comment field to study help sessions
ALTER TABLE public.study_help_sessions
  ADD COLUMN description TEXT;
