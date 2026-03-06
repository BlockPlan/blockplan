-- Quick notes for personal dashboard notepad
CREATE TABLE public.quick_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_quick_notes_user ON public.quick_notes(user_id);

ALTER TABLE public.quick_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own quick_notes"
  ON public.quick_notes FOR ALL
  USING (auth.uid() = user_id);
