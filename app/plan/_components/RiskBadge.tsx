"use client";

interface RiskBadgeProps {
  level: "at_risk" | "overdue_risk";
  taskTitle: string;
  onClick?: () => void;
}

export default function RiskBadge({ level, taskTitle, onClick }: RiskBadgeProps) {
  const Tag = onClick ? "button" : "span";
  const clickProps = onClick
    ? { onClick, type: "button" as const }
    : {};

  if (level === "overdue_risk") {
    return (
      <Tag
        {...clickProps}
        className={[
          "inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700",
          onClick ? "cursor-pointer transition-shadow hover:ring-1 hover:ring-red-400 hover:shadow-sm" : "",
        ].join(" ")}
      >
        <svg
          className="h-3.5 w-3.5 flex-shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
        Overdue risk — {taskTitle}
      </Tag>
    );
  }

  return (
    <Tag
      {...clickProps}
      className={[
        "inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700",
        onClick ? "cursor-pointer transition-shadow hover:ring-1 hover:ring-amber-400 hover:shadow-sm" : "",
      ].join(" ")}
    >
      <svg
        className="h-3.5 w-3.5 flex-shrink-0"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
      At risk — {taskTitle}
    </Tag>
  );
}
