-- Add reminder setting to tasks (minutes before due_date to notify)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reminder_minutes_before INTEGER;
