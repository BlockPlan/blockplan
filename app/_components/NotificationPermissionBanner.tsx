"use client";

import { useState, useEffect } from "react";
import { requestNotificationPermission } from "@/lib/services/reminder-manager";

/**
 * Dismissible banner that asks the user to enable browser notifications.
 * Only shows when permission is "default" (not yet decided).
 */
export default function NotificationPermissionBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  async function handleEnable() {
    const result = await requestNotificationPermission();
    if (result === "granted" || result === "denied") {
      setVisible(false);
    }
  }

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-xl" aria-hidden="true">🔔</span>
        <div>
          <p className="text-sm font-medium text-amber-900">
            Enable Reminders
          </p>
          <p className="text-xs text-amber-700">
            Get browser notifications before assignments are due.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleEnable}
          className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
        >
          Enable
        </button>
        <button
          onClick={() => setVisible(false)}
          className="rounded-lg px-2 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
