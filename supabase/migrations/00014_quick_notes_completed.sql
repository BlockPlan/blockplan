-- Add completed flag to quick notes
ALTER TABLE public.quick_notes
  ADD COLUMN completed BOOLEAN NOT NULL DEFAULT false;
