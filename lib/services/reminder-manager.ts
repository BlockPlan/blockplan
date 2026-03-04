/**
 * Client-side reminder scheduling using the Notification API.
 * Uses setTimeout to schedule notifications for upcoming tasks.
 */

export interface ReminderTask {
  id: string;
  title: string;
  due_date: string;
  reminder_minutes_before: number;
  courseName?: string | null;
}

// Active timers keyed by task ID
const activeTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Request browser notification permission.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

/**
 * Schedule a browser notification for a single task.
 */
export function scheduleReminder(task: ReminderTask): void {
  // Cancel any existing timer for this task
  cancelReminder(task.id);

  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const dueDate = new Date(task.due_date);
  const fireAt = new Date(dueDate.getTime() - task.reminder_minutes_before * 60 * 1000);
  const delay = fireAt.getTime() - Date.now();

  // Only schedule if the fire time is in the future and within 24 hours
  // (setTimeout accuracy degrades over very long periods)
  if (delay <= 0 || delay > 24 * 60 * 60 * 1000) return;

  const timer = setTimeout(() => {
    const timeLabel = formatReminderTime(task.reminder_minutes_before);
    const body = task.courseName
      ? `${task.courseName} — Due ${timeLabel}`
      : `Due ${timeLabel}`;

    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(`BlockPlan: ${task.title}`, {
          body,
          icon: "/favicon.ico",
          tag: `reminder-${task.id}`,
        });
      });
    } else {
      new Notification(`BlockPlan: ${task.title}`, {
        body,
        icon: "/favicon.ico",
        tag: `reminder-${task.id}`,
      });
    }

    activeTimers.delete(task.id);
  }, delay);

  activeTimers.set(task.id, timer);
}

/**
 * Cancel a scheduled reminder for a task.
 */
export function cancelReminder(taskId: string): void {
  const timer = activeTimers.get(taskId);
  if (timer) {
    clearTimeout(timer);
    activeTimers.delete(taskId);
  }
}

/**
 * Schedule reminders for all provided tasks.
 */
export function scheduleAllReminders(tasks: ReminderTask[]): void {
  // Clear all existing timers
  for (const [id] of activeTimers) {
    cancelReminder(id);
  }

  for (const task of tasks) {
    scheduleReminder(task);
  }
}

function formatReminderTime(minutes: number): string {
  if (minutes < 60) return `in ${minutes} minutes`;
  if (minutes < 1440) return `in ${Math.round(minutes / 60)} hours`;
  return `in ${Math.round(minutes / 1440)} days`;
}
