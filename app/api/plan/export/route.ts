import { createClient } from "@/lib/supabase/server";
import ical from "ical-generator";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get user timezone
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();

  const timezone = (profile?.timezone as string | null) ?? "America/Boise";

  // Get scheduled plan blocks with task and course info
  const { data: blocks } = await supabase
    .from("plan_blocks")
    .select("*, tasks(title, course_id, courses(name))")
    .eq("user_id", user.id)
    .eq("status", "scheduled")
    .order("start_time", { ascending: true });

  const calendar = ical({
    name: "BlockPlan Study Schedule",
    timezone,
  });

  for (const block of blocks ?? []) {
    const task = block.tasks as {
      title: string;
      courses: { name: string } | null;
    } | null;
    if (!task) continue;

    calendar.createEvent({
      start: new Date(block.start_time as string),
      end: new Date(block.end_time as string),
      summary: task.title,
      description: task.courses?.name ?? "",
      timezone,
    });
  }

  return new Response(calendar.toString(), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="blockplan.ics"',
    },
  });
}
