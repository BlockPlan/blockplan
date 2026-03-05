import type { Urgency } from "@/lib/services/study-suggestions";

const BADGE_STYLES: Record<Urgency, string> = {
  overdue: "bg-red-100 text-red-700",
  urgent: "bg-amber-100 text-amber-700",
  upcoming: "bg-yellow-100 text-yellow-700",
  normal: "bg-gray-100 text-gray-500",
};

export default function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  const label =
    urgency === "overdue"
      ? "Overdue"
      : urgency === "urgent"
        ? "Urgent"
        : urgency === "upcoming"
          ? "Soon"
          : "";

  if (!label) return null;

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_STYLES[urgency]}`}
    >
      {label}
    </span>
  );
}
