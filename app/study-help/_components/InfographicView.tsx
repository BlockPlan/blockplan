"use client";

import type { InfographicContent } from "@/lib/study-help/generate";

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; highlight: string; badge: string }> = {
  blue:   { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700",   highlight: "bg-blue-100 text-blue-800",   badge: "bg-blue-600" },
  green:  { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700",  highlight: "bg-green-100 text-green-800",  badge: "bg-green-600" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", highlight: "bg-purple-100 text-purple-800", badge: "bg-purple-600" },
  orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", highlight: "bg-orange-100 text-orange-800", badge: "bg-orange-600" },
  red:    { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-700",    highlight: "bg-red-100 text-red-800",    badge: "bg-red-600" },
  teal:   { bg: "bg-teal-50",   border: "border-teal-200",   text: "text-teal-700",   highlight: "bg-teal-100 text-teal-800",   badge: "bg-teal-600" },
  pink:   { bg: "bg-pink-50",   border: "border-pink-200",   text: "text-pink-700",   highlight: "bg-pink-100 text-pink-800",   badge: "bg-pink-600" },
  amber:  { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700",  highlight: "bg-amber-100 text-amber-800",  badge: "bg-amber-600" },
};

function getColors(color: string) {
  return COLOR_MAP[color] ?? COLOR_MAP.blue;
}

export default function InfographicView({ json }: { json: string }) {
  let content: InfographicContent;
  try {
    content = JSON.parse(json);
  } catch {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">Failed to parse study guide data.</p>
      </div>
    );
  }

  const themeColors = getColors(content.colorTheme);

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6 text-white">
        <h2 className="text-2xl font-bold">{content.title}</h2>
        {content.subtitle && (
          <p className="mt-1 text-sm text-indigo-100">{content.subtitle}</p>
        )}
      </div>

      {/* Quick facts bar */}
      {content.quickFacts && content.quickFacts.length > 0 && (
        <div className="px-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {content.quickFacts.map((fact, i) => (
              <div
                key={i}
                className={`rounded-lg border ${themeColors.border} ${themeColors.bg} p-3 text-center`}
              >
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {fact.label}
                </p>
                <p className={`mt-1 text-sm font-semibold ${themeColors.text}`}>
                  {fact.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section cards */}
      <div className="grid grid-cols-1 gap-4 px-6 md:grid-cols-2">
        {content.sections.map((section, i) => {
          const colors = getColors(section.color);
          return (
            <div
              key={i}
              className={`rounded-xl border-2 ${colors.border} ${colors.bg} p-4`}
            >
              <div className="mb-3 flex items-center gap-2">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors.badge} text-lg text-white`}>
                  {section.icon}
                </span>
                <h3 className={`text-base font-bold ${colors.text}`}>
                  {section.title}
                </h3>
              </div>
              <ul className="space-y-1.5 mb-3">
                {section.points.map((point, j) => (
                  <li key={j} className="flex gap-2 text-sm text-gray-700">
                    <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${colors.badge}`} />
                    {point}
                  </li>
                ))}
              </ul>
              {section.highlight && (
                <div className={`rounded-lg ${colors.highlight} px-3 py-2 text-xs font-medium`}>
                  {section.highlight}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Key takeaway */}
      {content.keyTakeaway && (
        <div className="mx-6 mb-6 rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500 text-lg text-white">
              💡
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                Key Takeaway
              </p>
              <p className="mt-1 text-sm font-medium text-amber-900">
                {content.keyTakeaway}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
