-- Add recurrence fields to tasks
-- recurrence_rule: { frequency: "weekly", days_of_week: [5], end_date: "2026-04-15" }
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurrence_rule JSONB;

-- Parent task reference for generated instances
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurrence_parent_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE;

-- Index for efficient parent lookups
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence_parent_id ON public.tasks(recurrence_parent_id);
