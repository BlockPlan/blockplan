import type { Metadata } from "next";
import NavHeader from "@/app/plan/_components/NavHeader";
import FeedbackForm from "./_components/FeedbackForm";

export const metadata: Metadata = {
  title: "Feedback | BlockPlan",
};

export default function FeedbackPage() {
  return (
    <div className="page-bg min-h-screen">
      <NavHeader />
      <main className="mx-auto max-w-xl px-4 py-8">
        <div className="mb-6">
          <h1 className="page-title">Send Feedback</h1>
          <p className="mt-1 text-sm text-gray-500">
            We&apos;d love to hear what you think! Your feedback helps us improve BlockPlan.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
          <FeedbackForm />
        </div>
      </main>
    </div>
  );
}
