import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NavHeader from "@/app/plan/_components/NavHeader";

export const metadata: Metadata = {
  title: "Pricing | BlockPlan",
  description: "Choose the right BlockPlan plan for your academic success",
};

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Everything you need to get organized and stay on top of coursework.",
    cta: "Get Started",
    highlighted: false,
    features: [
      "Task management (assignments, exams, readings)",
      "Calendar with Day, Week & Month views",
      "Course management",
      "Grade tracking & GPA calculator",
      "Syllabus upload & auto-extraction",
      "Create your own flashcards & quizzes",
      "Basic study block scheduling",
      "Mobile-friendly interface",
    ],
  },
  {
    name: "Pro",
    price: "$4.99",
    period: "/month",
    description: "Supercharge your study routine with AI and smart scheduling.",
    cta: "Upgrade to Pro",
    highlighted: true,
    badge: "Most Popular",
    features: [
      "Everything in Free, plus:",
      "AI-powered study help (summaries, flashcards, quizzes)",
      "Smart plan generation with auto-scheduling",
      "Export schedule to Google / Apple Calendar",
      "Browser reminders before due dates",
      "Recurring tasks (daily & weekly)",
      "Drag-and-drop block rescheduling",
      "Subtask milestones & progress tracking",
      "Spaced repetition flashcard system",
    ],
  },
  {
    name: "MAX",
    price: "$9.99",
    period: "/month",
    description: "The ultimate academic toolkit — no limits, no compromises.",
    cta: "Go MAX",
    highlighted: false,
    features: [
      "Everything in Pro, plus:",
      "Priority AI processing (faster responses)",
      "Unlimited AI study sessions",
      "Share study sets with classmates",
      "Export study materials to PDF",
      "Advanced analytics & insights",
      "Backward planning mode",
      "Priority support",
      "Early access to new features",
    ],
  },
] as const;

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  return (
    <div className="page-bg">
      <NavHeader />

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Choose Your Plan
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-gray-500">
            Start free and upgrade when you&apos;re ready. Every plan is built
            to help you study smarter and stay ahead.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-xl border-2 bg-white p-6 shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)] ${
                tier.highlighted
                  ? "border-blue-500 ring-1 ring-blue-500/20"
                  : "border-gray-200"
              }`}
            >
              {/* Badge */}
              {tier.highlighted && "badge" in tier && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                    {tier.badge}
                  </span>
                </div>
              )}

              {/* Tier name */}
              <h2 className="text-lg font-semibold text-gray-900">
                {tier.name}
              </h2>

              {/* Price */}
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900">
                  {tier.price}
                </span>
                <span className="text-sm text-gray-500">{tier.period}</span>
              </div>

              {/* Description */}
              <p className="mt-3 text-sm text-gray-500">{tier.description}</p>

              {/* CTA */}
              <button
                className={`mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ${
                  tier.highlighted
                    ? "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                }`}
              >
                {tier.cta}
              </button>

              {/* Divider */}
              <div className="my-6 border-t border-gray-100" />

              {/* Features */}
              <ul className="flex flex-1 flex-col gap-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <CheckIcon />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ / Footer */}
        <div className="mt-12 rounded-xl border border-gray-200 bg-white p-6 text-center shadow-[var(--shadow-card)]">
          <h3 className="text-base font-semibold text-gray-900">
            Questions about pricing?
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            All plans include a 14-day free trial of Pro features. Cancel
            anytime — no commitments, no hidden fees.
          </p>
        </div>
      </main>
    </div>
  );
}
