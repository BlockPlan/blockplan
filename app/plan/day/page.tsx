import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { startOfDay, endOfDay } from "date-fns";
import { tz } from "@date-fns/tz";
import NavHeader from "@/app/plan/_components/NavHeader";
import DayTimeline from "../_components/DayTimeline";

export default async function DayPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Load user profile for timezone
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();

  const timezone = (profile?.timezone as string | null) ?? "America/Boise";

  // Compute today's boundaries in user timezone
  const userTz = tz(timezone);
  const todayStart = startOfDay(new Date(), { in: userTz });
  const todayEnd = endOfDay(new Date(), { in: userTz });

  // Query today's plan_blocks
  const { data: blocks } = await supabase
    .from("plan_blocks")
    .select(
      "*, tasks(title, type, estimated_minutes, due_date, course_id, courses(name))"
    )
    .eq("user_id", user.id)
    .gte("start_time", todayStart.toISOString())
    .lte("start_time", todayEnd.toISOString())
    .order("start_time", { ascending: true });

  // Query top priority tasks (incomplete, ordered by due_date ASC, limit 5)
  const { data: priorityTasks } = await supabase
    .from("tasks")
    .select(
      "id, title, type, due_date, estimated_minutes, status, course_id, courses(name)"
    )
    .eq("user_id", user.id)
    .neq("status", "done")
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(5);

  // Calculate estimated time remaining from scheduled blocks
  const safeBlocks = (blocks ?? []).map((b) => ({
    id: b.id as string,
    start_time: b.start_time as string,
    end_time: b.end_time as string,
    status: b.status as "scheduled" | "done" | "missed",
    tasks: b.tasks
      ? {
          title: (
            b.tasks as { title: string; courses: { name: string } | null }
          ).title,
          courses: (
            b.tasks as { title: string; courses: { name: string } | null }
          ).courses,
        }
      : null,
  }));

  const remainingMinutes = safeBlocks
    .filter((b) => b.status === "scheduled")
    .reduce((sum, b) => {
      const start = new Date(b.start_time);
      const end = new Date(b.end_time);
      return sum + (end.getTime() - start.getTime()) / 60000;
    }, 0);

  const safePriorities = (priorityTasks ?? []).map((t) => ({
    id: t.id as string,
    title: t.title as string,
    type: t.type as string,
    due_date: t.due_date as string | null,
    estimated_minutes: t.estimated_minutes as number,
    status: t.status as string,
    courses: t.courses as unknown as { name: string } | null,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <NavHeader />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <DayTimeline
          blocks={safeBlocks}
          priorityTasks={safePriorities}
          remainingMinutes={remainingMinutes}
        />
      </main>
    </div>
  );
}
