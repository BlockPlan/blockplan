import { format, addDays, startOfDay } from "date-fns";
import { tz } from "@date-fns/tz";

export interface WeeklyPlanTask {
  title: string;
  type: string;
  dueDate: string | null;
  courseName: string | null;
}

export interface WeeklyPlanBlock {
  startTime: string;
  taskTitle: string;
}

export interface WeeklyPlanData {
  firstName: string | null;
  tasksThisWeek: WeeklyPlanTask[];
  examsThisWeek: WeeklyPlanTask[];
  blockCount: number;
  currentStreak: number;
  weekLabel: string;
  signInUrl: string;
}

export function renderWeeklyPlanHtml(d: WeeklyPlanData): string {
  const taskRows = d.tasksThisWeek
    .slice(0, 8)
    .map((t) => {
      const due = t.dueDate
        ? `<span style="color:#6b7280;font-size:13px;">· ${t.dueDate}</span>`
        : "";
      const course = t.courseName
        ? `<span style="color:#9ca3af;font-size:12px;">${escape(t.courseName)}</span><br/>`
        : "";
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
            ${course}
            <strong style="font-size:14px;color:#111827;">${escape(t.title)}</strong>
            ${due}
          </td>
        </tr>`;
    })
    .join("");

  const overflow =
    d.tasksThisWeek.length > 8
      ? `<p style="margin:10px 0 0;font-size:13px;color:#6b7280;">+ ${d.tasksThisWeek.length - 8} more this week</p>`
      : "";

  const examsBlock = d.examsThisWeek.length
    ? `
      <div style="margin:24px 0;padding:16px 18px;background:#fef2f2;border:1px solid #fecaca;border-radius:12px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#b91c1c;">
          ${d.examsThisWeek.length} exam${d.examsThisWeek.length === 1 ? "" : "s"} this week
        </p>
        ${d.examsThisWeek
          .map(
            (e) =>
              `<p style="margin:4px 0;font-size:14px;color:#7f1d1d;"><strong>${escape(e.title)}</strong>${e.courseName ? ` — ${escape(e.courseName)}` : ""}${e.dueDate ? ` · ${e.dueDate}` : ""}</p>`
          )
          .join("")}
      </div>`
    : "";

  const streakBlock =
    d.currentStreak > 0
      ? `
      <div style="margin:0 0 20px;padding:12px 16px;background:linear-gradient(135deg,#fff7ed,#fef3c7);border:1px solid #fed7aa;border-radius:12px;font-size:14px;color:#9a3412;">
        🔥 <strong>${d.currentStreak}-day streak.</strong> Keep it going this week.
      </div>`
      : "";

  const emptyState =
    d.tasksThisWeek.length === 0 && d.examsThisWeek.length === 0
      ? `
      <p style="margin:16px 0 0;font-size:15px;color:#4b5563;line-height:1.6;">
        Nothing on the schedule yet for the week. Upload a new syllabus or add
        tasks to start planning.
      </p>`
      : "";

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f6f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f6f7fb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(16,24,40,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#2563eb 0%,#7c3aed 100%);padding:24px 28px;">
                <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">BlockPlan</div>
                <div style="margin-top:4px;font-size:13px;color:#dbeafe;">Your week ahead · ${d.weekLabel}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 28px 8px;">
                <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#111827;">
                  Here's what's coming this week
                </h1>
                ${streakBlock}
                ${examsBlock}
                ${
                  d.tasksThisWeek.length
                    ? `
                  <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#6b7280;">Due this week</p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${taskRows}</table>
                  ${overflow}`
                    : ""
                }
                ${emptyState}
                <p style="margin:28px 0 10px;font-size:14px;color:#4b5563;">
                  ${d.blockCount > 0 ? `You've got ${d.blockCount} study block${d.blockCount === 1 ? "" : "s"} scheduled. ` : ""}Open your plan to adjust anything.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 28px;">
                  <tr>
                    <td style="border-radius:10px;background:linear-gradient(135deg,#2563eb 0%,#7c3aed 100%);">
                      <a href="${d.signInUrl}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">
                        Open my plan
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 24px;background-color:#fafafb;border-top:1px solid #eef0f4;">
                <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;line-height:1.5;">
                  BlockPlan · <a href="https://block-plan.com" style="color:#9ca3af;text-decoration:underline;">block-plan.com</a>
                </p>
                <p style="margin:0;font-size:11px;color:#b7bcc5;">
                  Don't want weekly plans? <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#b7bcc5;text-decoration:underline;">Unsubscribe</a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatDueDateShort(iso: string | null, timezone: string): string | null {
  if (!iso) return null;
  return format(new Date(iso), "EEE MMM d", { in: tz(timezone) });
}

export function weekBounds(timezone: string): { startIso: string; endIso: string; label: string } {
  const now = new Date();
  const start = startOfDay(now, { in: tz(timezone) });
  const end = addDays(start, 7);
  const label = `${format(start, "MMM d", { in: tz(timezone) })} – ${format(addDays(end, -1), "MMM d", { in: tz(timezone) })}`;
  return { startIso: start.toISOString(), endIso: end.toISOString(), label };
}
