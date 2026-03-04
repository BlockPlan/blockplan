-- Add grade column to tasks table (points and weight already exist)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS grade NUMERIC;

-- Add per-course grading scale (JSONB: { "A": 93, "A-": 90, ... })
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS grading_scale JSONB;
