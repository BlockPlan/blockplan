import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  renderWeeklyPlanHtml,
  formatDueDateShort,
  weekBounds,
  type WeeklyPlanTask,
} from "@/lib/weekly-plan-email";

// Max duration is 60s on Hobby. Should be plenty for ~200 users; batch
// scales linearly from there.
export const maxDuration = 60;

const FROM_EMAIL = "BlockPlan <noreply@block-plan.com>";
const SIGN_IN_URL = "https://block-plan.com/auth";

export async function GET(request: NextRequest) {
  // Vercel cron sends the Authorization header `Bearer <CRON_SECRET>`.
  // Reject anything else to prevent anyone from firing weekly emails.
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not configured" },
      { status: 500 }
    );
  }

  const admin = createAdminClient();

  // Pull every confirmed user. 1000 is Supabase's listUsers cap per page;
  // once we grow past that we add pagination.
  const { data: usersPage } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const users = (usersPage?.users ?? []).filter((u) => !!u.email_confirmed_at);

  const { data: profiles } = await admin
    .from("user_profiles")
    .select("id, timezone, current_streak_days");
  const profileById = new Map(
    (profiles ?? []).map((p) => [
      p.id as string,
      {
        timezone: (p.timezone as string | null) ?? "America/Boise",
        streak: (p.current_streak_days as number | null) ?? 0,
      },
    ])
  );

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of users) {
    try {
      if (!user.email) {
        skipped++;
        continue;
      }
      const profile = profileById.get(user.id) ?? {
        timezone: "America/Boise",
        streak: 0,
      };
      const { startIso, endIso, label } = weekBounds(profile.timezone);

      const { data: taskRows } = await admin
        .from("tasks")
        .select(
          "id, title, type, due_date, status, courses(name)"
        )
        .eq("user_id", user.id)
        .neq("status", "done")
        .gte("due_date", startIso)
        .lt("due_date", endIso)
        .order("due_date", { ascending: true })
        .limit(50);

      const rows = taskRows ?? [];
      const mapped: WeeklyPlanTask[] = rows.map((r) => ({
        title: r.title as string,
        type: r.type as string,
        dueDate: formatDueDateShort(r.due_date as string | null, profile.timezone),
        courseName:
          (r.courses as unknown as { name: string } | null)?.name ?? null,
      }));
      const exams = mapped.filter((m) => m.type === "exam");
      const other = mapped.filter((m) => m.type !== "exam");

      const { count: blockCount } = await admin
        .from("plan_blocks")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("start_time", startIso)
        .lt("start_time", endIso);

      // Skip people with literally nothing to say about — avoids spamming
      // dormant accounts with "nothing happening!" every week.
      if (mapped.length === 0 && (blockCount ?? 0) === 0) {
        skipped++;
        continue;
      }

      const html = renderWeeklyPlanHtml({
        firstName: null,
        tasksThisWeek: other,
        examsThisWeek: exams,
        blockCount: blockCount ?? 0,
        currentStreak: profile.streak,
        weekLabel: label,
        signInUrl: SIGN_IN_URL,
      });

      const subject = exams.length
        ? `${exams.length} exam${exams.length === 1 ? "" : "s"} this week + ${other.length} assignment${other.length === 1 ? "" : "s"}`
        : `Your week: ${other.length} assignment${other.length === 1 ? "" : "s"} coming up`;

      const resendResp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [user.email],
          reply_to: "hello@block-plan.com",
          subject,
          html,
        }),
      });

      if (!resendResp.ok) {
        failed++;
        console.error(
          `[weekly-plan] send failed for ${user.email}:`,
          resendResp.status,
          await resendResp.text().catch(() => "")
        );
        continue;
      }
      sent++;
    } catch (err) {
      failed++;
      console.error("[weekly-plan] error:", err);
    }
  }

  return NextResponse.json({
    ok: true,
    totalUsers: users.length,
    sent,
    skipped,
    failed,
  });
}
