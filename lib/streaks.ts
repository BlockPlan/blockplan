import type { SupabaseClient } from "@supabase/supabase-js";
import { format, differenceInCalendarDays } from "date-fns";
import { tz } from "@date-fns/tz";

/**
 * Update the user's completion streak when a task has just been marked done.
 *
 * - Same-day completion: no change.
 * - Completion the day after the last one: streak extends by 1.
 * - Longer gap (or first ever completion): streak resets to 1.
 *
 * Called from updateTaskStatus. Silent on error — a failure here must
 * never block the actual status update, which has already succeeded.
 */
export async function recordTaskCompletionForStreak(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  try {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("timezone, current_streak_days, longest_streak_days, last_task_completed_on")
      .eq("id", userId)
      .single();

    const timezone = (profile?.timezone as string | null) ?? "America/Boise";
    const todayLocal = format(new Date(), "yyyy-MM-dd", { in: tz(timezone) });

    const last = profile?.last_task_completed_on as string | null;
    const current = (profile?.current_streak_days as number | null) ?? 0;
    const longest = (profile?.longest_streak_days as number | null) ?? 0;

    let newCurrent: number;
    if (!last) {
      newCurrent = 1;
    } else if (last === todayLocal) {
      // Already counted today — nothing to do.
      return;
    } else {
      const gap = differenceInCalendarDays(
        new Date(todayLocal),
        new Date(last)
      );
      newCurrent = gap === 1 ? current + 1 : 1;
    }

    const newLongest = Math.max(longest, newCurrent);

    await supabase
      .from("user_profiles")
      .update({
        current_streak_days: newCurrent,
        longest_streak_days: newLongest,
        last_task_completed_on: todayLocal,
      })
      .eq("id", userId);
  } catch (err) {
    console.error("[recordTaskCompletionForStreak] skipped due to error:", err);
  }
}
