import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NavHeader from "@/app/plan/_components/NavHeader";
import PricingButtons from "./_components/PricingButtons";
import PricingToasts from "./_components/PricingToasts";
import { getUserPlan, type SubscriptionPlan } from "@/lib/subscription";

export const metadata: Metadata = {
  title: "Pricing | BlockPlan",
  description: "Choose the right BlockPlan plan for your academic success",
};

const tiers = [
  {
    key: "free" as const,
    name: "Free",
    price: "$0",
    period: "forever",
    description:
      "Everything you need to get organized and stay on top of coursework.",
    cta: "Get Started",
    highlighted: false,
    features: [
      "2 courses",
      "1 AI study material / month",
      "5 lifetime illustrations",
      "Basic calendar (Day, Week & Month)",
      "Task management & grade tracking",
      "Syllabus upload & auto-extraction",
      "Create your own flashcards & quizzes",
      "Mobile-friendly interface",
    ],
  },
  {
    key: "pro" as const,
    name: "Pro",
    price: "$4.99",
    period: "/month",
    description:
      "Supercharge your study routine with AI and smart scheduling.",
    cta: "Upgrade to Pro",
    highlighted: true,
    badge: "Most Popular",
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      "Unlimited courses",
      "15 AI study materials / month",
      "15 illustrations / month",
      "Full calendar with all views",
      "AI-powered study help (summaries, flashcards, quizzes)",
      "Smart plan generation with auto-scheduling",
      "Export schedule to Google / Apple Calendar",
      "AI Tutor Chat",
      "Drag-and-drop block rescheduling",
      "Spaced repetition flashcard system",
    ],
  },
  {
    key: "max" as const,
    name: "MAX",
    price: "$7.99",
    period: "/month",
    description:
      "The ultimate academic toolkit — no limits, no compromises.",
    cta: "Go MAX",
    highlighted: false,
    badge: "Best Value",
    priceId: process.env.STRIPE_MAX_PRICE_ID,
    features: [
      "Unlimited courses",
      "50 AI study materials / month",
      "Unlimited illustrations (5 / session)",
      "Everything in Pro, plus:",
      "Export study materials to .docx",
      "Priority AI processing (faster responses)",
      "Advanced analytics & insights",
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

  const currentPlan = await getUserPlan(user.id);

  // Check if user has a stripe customer (for "Manage Subscription" button)
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  const hasStripeCustomer = !!profile?.stripe_customer_id;

  return (
    <div className="page-bg">
      <NavHeader />

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Toasts from URL params */}
        <Suspense fallback={null}>
          <PricingToasts />
        </Suspense>

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
          {tiers.map((tier) => {
            const isCurrentPlan = tier.key === currentPlan;
            const isUpgrade = tierRank(tier.key) > tierRank(currentPlan);

            return (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-xl border-2 bg-white p-6 shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)] ${
                  tier.highlighted
                    ? "border-blue-500 ring-1 ring-blue-500/20"
                    : isCurrentPlan
                      ? "border-emerald-400 ring-1 ring-emerald-400/20"
                      : "border-gray-200"
                }`}
              >
                {/* Badge */}
                {"badge" in tier && tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm ${
                        tier.highlighted ? "bg-blue-600" : "bg-purple-600"
                      }`}
                    >
                      {tier.badge}
                    </span>
                  </div>
                )}

                {/* Current Plan indicator */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                      Current Plan
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
                <PricingButtons
                  tierKey={tier.key}
                  tierName={tier.name}
                  cta={tier.cta}
                  highlighted={tier.highlighted}
                  priceId={"priceId" in tier ? (tier.priceId ?? null) : null}
                  userId={user.id}
                  isCurrentPlan={isCurrentPlan}
                  isUpgrade={isUpgrade}
                  hasStripeCustomer={hasStripeCustomer}
                />

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
            );
          })}
        </div>

        {/* FAQ / Footer */}
        <div className="mt-12 rounded-xl border border-gray-200 bg-white p-6 text-center shadow-[var(--shadow-card)]">
          <h3 className="text-base font-semibold text-gray-900">
            Questions about pricing?
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Cancel anytime from your subscription portal — no commitments, no
            hidden fees.
          </p>
        </div>
      </main>
    </div>
  );
}

// Helper to rank tiers for comparison
function tierRank(plan: SubscriptionPlan): number {
  switch (plan) {
    case "free":
      return 0;
    case "pro":
      return 1;
    case "max":
      return 2;
  }
}
