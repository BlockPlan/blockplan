"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function PricingToasts() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Subscription activated! Welcome to your new plan.", {
        duration: 5000,
      });
      // Clean up the URL
      router.replace("/pricing", { scroll: false });
    } else if (searchParams.get("canceled") === "true") {
      toast.info("Checkout canceled. No changes were made.", {
        duration: 4000,
      });
      router.replace("/pricing", { scroll: false });
    }
  }, [searchParams, router]);

  return null;
}
