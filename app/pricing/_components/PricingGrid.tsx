"use client";

import { useState } from "react";
import PricingButtons from "./PricingButtons";

type BillingInterval = "monthly" | "annual";

interface TierConfig {
  key: "free" | "pro" | "max";
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  annualTotal: string;
  savingsPercent: string;
  period: string;
  description: string;
  cta: string;
  highlighted: boolean;
  badge?: string;
  monthlyPriceId: string | null;
  annualPriceId: string | null;
  features: string[];
}

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

export default function PricingGrid({
  tiers,
  userId,
  currentPlan,
  hasStripeCustomer,
}: {
  tiers: TierConfig[];
  userId: string;
  currentPlan: string;
  hasStripeCustomer: boolean;
}) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  function tierRank(plan: string): number {
    switch (plan) {
      case "free":
        return 0;
      case "pro":
        return 1;
      case "max":
        return 2;
      default:
        return 0;
    }
  }

  return (
    <>
      {/* Billing Toggle */}
      <div className="mb-10 flex items-center justify-center gap-3">
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

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {tiers.map((tier) => {
          const isCurrentPlan = tier.key === currentPlan;
          const isUpgrade = tierRank(tier.key) > tierRank(currentPlan);
          const isAnnual = interval === "annual";
          const price = tier.key === "free"
            ? tier.monthlyPrice
            : isAnnual
              ? tier.annualPrice
              : tier.monthlyPrice;
          const priceId = tier.key === "free"
            ? null
            : isAnnual
              ? tier.annualPriceId
              : tier.monthlyPriceId;

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
              {tier.badge && (
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
              <div className="mt-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">
                    {price}
                  </span>
                  <span className="text-sm text-gray-500">
                    {tier.key === "free" ? tier.period : "/month"}
                  </span>
                </div>
                {/* Annual subtitle */}
                {tier.key !== "free" && isAnnual && (
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

              {/* Description */}
              <p className="mt-3 text-sm text-gray-500">{tier.description}</p>

              {/* CTA */}
              <PricingButtons
                tierKey={tier.key}
                tierName={tier.name}
                cta={tier.cta}
                highlighted={tier.highlighted}
                priceId={priceId}
                userId={userId}
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
    </>
  );
}
