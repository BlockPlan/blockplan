-- Tracks spaced-repetition progress per flashcard (Leitner box system)
CREATE TABLE public.flashcard_reviews (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id    UUID        NOT NULL REFERENCES public.study_help_sessions(id) ON DELETE CASCADE,
  card_index    INT         NOT NULL,
  box           INT         NOT NULL DEFAULT 1,
  review_count  INT         NOT NULL DEFAULT 0,
  last_reviewed TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_id, card_index)
);

CREATE INDEX idx_flashcard_reviews_user_session
  ON public.flashcard_reviews(user_id, session_id);

ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reviews"
  ON public.flashcard_reviews FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
