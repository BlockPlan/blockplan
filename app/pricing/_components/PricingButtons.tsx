"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PricingButtons({
  tierName,
  cta,
  highlighted,
}: {
  tierName: string;
  cta: string;
  highlighted: boolean;
}) {
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);

  const handleClick = () => {
    if (tierName === "Free") {
      router.push("/plan");
      return;
    }
    // Pro and MAX — payment not yet set up
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ${
          highlighted
            ? "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        }`}
      >
        {cta}
      </button>

      {showToast && (
        <div className="absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white shadow-lg">
          Coming soon! Payment integration is on the way.
        </div>
      )}
    </div>
  );
}
