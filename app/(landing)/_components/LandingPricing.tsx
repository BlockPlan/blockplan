"use client";

import { useState } from "react";
import Link from "next/link";

type BillingInterval = "monthly" | "annual";

const pricingTiers = [
  {
    name: "Free",
    monthlyPrice: "$0",
    annualPrice: "$0",
    annualTotal: "",
    savingsPercent: "",
    period: "forever",
    description: "Everything you need to get organized and stay on top of coursework.",
    cta: "Get Started Free",
    highlighted: false,
    features: [
      "2 courses",
      "1 AI study material / month",
      "1 illustration / month",
      "2 saved study sessions",
      "Basic calendar (Day, Week & Month)",
      "Task management & grade tracking",
      "Syllabus upload & auto-extraction",
      "Create your own flashcards & quizzes",
      "Mobile-friendly interface",
    ],
  },
  {
    name: "Pro",
    monthlyPrice: "$4.99",
    annualPrice: "$3.99",
    annualTotal: "$47.88",
    savingsPercent: "20%",
    period: "/month",
    description: "Supercharge your study routine with AI and smart scheduling.",
    cta: "Start Pro Trial",
    highlighted: true,
    badge: "Most Popular",
    features: [
      "Unlimited courses",
      "100 AI study materials / month",
      "Unlimited illustrations",
      "50 saved study sessions",
      "Full calendar with all views",
      "AI-powered study help",
      "Smart plan generation with auto-scheduling",
      "Export to Google / Apple Calendar",
      "AI Tutor Chat",
      "Drag-and-drop block rescheduling",
      "Spaced repetition flashcard system",
    ],
  },
  {
    name: "MAX",
    monthlyPrice: "$7.99",
    annualPrice: "$5.99",
    annualTotal: "$71.88",
    savingsPercent: "25%",
    period: "/month",
    description: "The ultimate academic toolkit -- no limits, no compromises.",
    cta: "Go MAX",
    highlighted: false,
    badge: "Best Value",
    features: [
      "Unlimited courses",
      "Unlimited AI study materials",
      "Unlimited illustrations",
      "Unlimited saved sessions",
      "Everything in Pro, plus:",
      "Export study materials to .docx",
      "Priority AI processing",
      "Advanced analytics & insights",
      "Priority support",
      "Early access to new features",
    ],
  },
];

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className || "h-4 w-4"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function LandingPricing() {
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  return (
    <section id="pricing" className="scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Simple, Student-Friendly Pricing
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Start free and upgrade when you are ready. Every plan helps you
            study smarter.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="mt-10 flex items-center justify-center gap-3">
          <span
            className={`text-sm font-medium transition-colors duration-200 ${
              interval === "monthly" ? "text-gray-900" : "text-gray-400"
            }`}
          >
            Monthly
          </span>

          <button
            type="button"
            role="switch"
            aria-checked={interval === "annual"}
            onClick={() =>
              setInterval((prev) =>
                prev === "monthly" ? "annual" : "monthly"
              )
            }
            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              interval === "annual" ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-[22px] w-[22px] transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-300 ease-in-out ${
                interval === "annual" ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>

          <span
            className={`text-sm font-medium transition-colors duration-200 ${
              interval === "annual" ? "text-gray-900" : "text-gray-400"
            }`}
          >
            Annual
          </span>

          {/* Save badge */}
          <span
            className={`rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 transition-all duration-300 ${
              interval === "annual"
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-1 opacity-0"
            }`}
          >
            Save up to 25%
          </span>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
          {pricingTiers.map((tier) => {
            const isAnnual = interval === "annual";
            const isFree = tier.name === "Free";
            const price = isFree
              ? tier.monthlyPrice
              : isAnnual
                ? tier.annualPrice
                : tier.monthlyPrice;

            return (
              <div
                key={tier.name}
                className={`landing-reveal relative flex flex-col rounded-2xl border-2 bg-white p-8 shadow-sm transition-shadow duration-300 hover:shadow-md ${
                  tier.highlighted
                    ? "border-blue-500 ring-1 ring-blue-500/20"
                    : "border-gray-100"
                }`}
              >
                {/* Badge */}
                {tier.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span
                      className={`rounded-full px-4 py-1 text-xs font-semibold text-white shadow-sm ${
                        tier.highlighted ? "bg-blue-600" : "bg-purple-600"
                      }`}
                    >
                      {tier.badge}
                    </span>
                  </div>
                )}

                <h3 className="text-lg font-semibold text-gray-900">
                  {tier.name}
                </h3>

                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">
                      {price}
                    </span>
                    <span className="text-sm text-gray-500">
                      {isFree ? tier.period : "/month"}
                    </span>
                  </div>
                  {/* Annual subtitle */}
                  {!isFree && isAnnual && (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {tier.annualTotal}/yr &middot; billed annually
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Save {tier.savingsPercent}
                      </span>
                    </div>
                  )}
                </div>

                <p className="mt-3 text-sm text-gray-500">
                  {tier.description}
                </p>

                <Link
                  href="/auth"
                  className={`mt-6 block rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-all ${
                    tier.highlighted
                      ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:shadow"
                      : "border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {tier.cta}
                </Link>

                <div className="my-6 border-t border-gray-100" />

                <ul className="flex flex-1 flex-col gap-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
