-- BlockPlan Initial Schema
-- Phase 1: Foundation
-- All tables, RLS policies, indexes, storage bucket, and triggers

-- =============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TABLE: terms
-- =============================================================================

CREATE TABLE public.terms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own terms" ON public.terms
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own terms" ON public.terms
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own terms" ON public.terms
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own terms" ON public.terms
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_terms_user_id ON public.terms(user_id);

CREATE TRIGGER set_terms_updated_at
  BEFORE UPDATE ON public.terms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================================================
-- TABLE: courses
-- =============================================================================

CREATE TABLE public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  meeting_times JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own courses" ON public.courses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own courses" ON public.courses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own courses" ON public.courses
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own courses" ON public.courses
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_courses_user_id ON public.courses(user_id);
CREATE INDEX idx_courses_term_id ON public.courses(term_id);

CREATE TRIGGER set_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================================================
-- TABLE: tasks
-- =============================================================================

CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('assignment', 'exam', 'reading', 'other')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
  due_date TIMESTAMPTZ,
  estimated_minutes INTEGER,
  points NUMERIC,
  weight NUMERIC,
  needs_review BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_course_id ON public.tasks(course_id);

CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================================================
-- TABLE: subtasks
-- =============================================================================

CREATE TABLE public.subtasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
  due_date TIMESTAMPTZ,
  estimated_minutes INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subtasks" ON public.subtasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subtasks" ON public.subtasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subtasks" ON public.subtasks
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own subtasks" ON public.subtasks
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_subtasks_user_id ON public.subtasks(user_id);
CREATE INDEX idx_subtasks_task_id ON public.subtasks(task_id);

CREATE TRIGGER set_subtasks_updated_at
  BEFORE UPDATE ON public.subtasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================================================
-- TABLE: availability_rules
-- =============================================================================

CREATE TABLE public.availability_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('available', 'blocked', 'preferred')),
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own availability_rules" ON public.availability_rules
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own availability_rules" ON public.availability_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own availability_rules" ON public.availability_rules
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own availability_rules" ON public.availability_rules
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_availability_rules_user_id ON public.availability_rules(user_id);

CREATE TRIGGER set_availability_rules_updated_at
  BEFORE UPDATE ON public.availability_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================================================
-- TABLE: plan_blocks
-- =============================================================================

CREATE TABLE public.plan_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'done', 'missed')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.plan_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plan_blocks" ON public.plan_blocks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plan_blocks" ON public.plan_blocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plan_blocks" ON public.plan_blocks
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own plan_blocks" ON public.plan_blocks
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_plan_blocks_user_id ON public.plan_blocks(user_id);
CREATE INDEX idx_plan_blocks_task_id ON public.plan_blocks(task_id);

CREATE TRIGGER set_plan_blocks_updated_at
  BEFORE UPDATE ON public.plan_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================================================
-- STORAGE: syllabi bucket
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('syllabi', 'syllabi', false);

CREATE POLICY "Users can upload own syllabi" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'syllabi'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own syllabi" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'syllabi'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own syllabi" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'syllabi'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
