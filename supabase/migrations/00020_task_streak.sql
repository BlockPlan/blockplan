-- Streak tracking: consecutive days with at least one completed task.
--
-- Updated from the application layer whenever a task is marked done
-- (see updateTaskStatus in app/tasks/actions.ts). Not a trigger because
-- the "yesterday vs today vs older" logic lives better in app code with
-- the user's timezone available.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS current_streak_days INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak_days INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_task_completed_on DATE;

COMMENT ON COLUMN public.user_profiles.current_streak_days IS
  'Current consecutive-day streak of completing at least one task. Resets to 0 if a day is skipped.';
COMMENT ON COLUMN public.user_profiles.longest_streak_days IS
  'All-time longest streak for this user.';
COMMENT ON COLUMN public.user_profiles.last_task_completed_on IS
  'Date (in user timezone) of the most recent task completion. Used to detect same-day / consecutive-day / broken-streak.';
