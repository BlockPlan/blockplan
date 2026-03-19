"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PricingButtons({
  tierKey,
  tierName,
  cta,
  highlighted,
  priceId,
  userId,
  isCurrentPlan,
  isUpgrade,
  hasStripeCustomer,
}: {
  tierKey: string;
  tierName: string;
  cta: string;
  highlighted: boolean;
  priceId: string | null;
  userId: string;
  isCurrentPlan: boolean;
  isUpgrade: boolean;
  hasStripeCustomer: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!priceId) return;
    setLoading(true);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, userId }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned:", data);
        setLoading(false);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setLoading(false);
    }
  };

  const handleManage = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No portal URL returned:", data);
        setLoading(false);
      }
    } catch (err) {
      console.error("Portal error:", err);
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (tierKey === "free") {
      router.push("/plan");
      return;
    }

    if (isCurrentPlan && hasStripeCustomer) {
      handleManage();
      return;
    }

    if (isUpgrade || !isCurrentPlan) {
      handleCheckout();
      return;
    }
  };

  // Determine button label
  let buttonLabel = cta;
  if (isCurrentPlan && tierKey === "free") {
    buttonLabel = "Current Plan";
  } else if (isCurrentPlan && hasStripeCustomer) {
    buttonLabel = "Manage Subscription";
  } else if (isCurrentPlan) {
    buttonLabel = "Current Plan";
  }

  const isDisabled = isCurrentPlan && tierKey === "free";

  return (
    <button
      onClick={handleClick}
      disabled={loading || isDisabled}
      className={`mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
        isCurrentPlan && tierKey !== "free"
          ? "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          : highlighted
            ? "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      }`}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Redirecting...
        </span>
      ) : (
        buttonLabel
      )}
    </button>
  );
}
