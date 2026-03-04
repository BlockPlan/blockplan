"use client";

import { useEffect } from "react";
import {
  scheduleAllReminders,
  type ReminderTask,
} from "@/lib/services/reminder-manager";

interface ReminderInitProps {
  tasks: ReminderTask[];
}

/**
 * Invisible client component that schedules browser notifications
 * for all tasks with reminders on mount (dashboard load).
 */
export default function ReminderInit({ tasks }: ReminderInitProps) {
  useEffect(() => {
    if (tasks.length === 0) return;
    scheduleAllReminders(tasks);
  }, [tasks]);

  return null;
}
