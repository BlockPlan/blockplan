import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NavHeader from "@/app/plan/_components/NavHeader";
import PricingGrid from "./_components/PricingGrid";
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
    monthlyPrice: "$0",
    annualPrice: "$0",
    annualTotal: "$0",
    savingsPercent: "",
    period: "forever",
    description:
      "Everything you need to get organized and stay on top of coursework.",
    cta: "Get Started",
    highlighted: false,
    monthlyPriceId: null,
    annualPriceId: null,
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
    monthlyPrice: "$4.99",
    annualPrice: "$3.99",
    annualTotal: "$47.88",
    savingsPercent: "20%",
    period: "/month",
    description:
      "Supercharge your study routine with AI and smart scheduling.",
    cta: "Upgrade to Pro",
    highlighted: true,
    badge: "Most Popular",
    monthlyPriceId: process.env.STRIPE_PRO_PRICE_ID ?? null,
    annualPriceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID ?? null,
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
    monthlyPrice: "$7.99",
    annualPrice: "$5.99",
    annualTotal: "$71.88",
    savingsPercent: "25%",
    period: "/month",
    description:
      "The ultimate academic toolkit — no limits, no compromises.",
    cta: "Go MAX",
    highlighted: false,
    badge: "Best Value",
    monthlyPriceId: process.env.STRIPE_MAX_PRICE_ID ?? null,
    annualPriceId: process.env.STRIPE_MAX_ANNUAL_PRICE_ID ?? null,
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
];

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

        {/* Billing Toggle + Pricing Grid */}
        <PricingGrid
          tiers={tiers}
          userId={user.id}
          currentPlan={currentPlan}
          hasStripeCustomer={hasStripeCustomer}
        />

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
