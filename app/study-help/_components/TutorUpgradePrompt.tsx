"use client";

import Link from "next/link";

export default function TutorUpgradePrompt() {
  return (
    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-purple-50 to-blue-50 p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
        <svg
          className="h-7 w-7 text-purple-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900">AI Tutor Chat</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
        Get personalized explanations, ask follow-up questions, and have an
        interactive conversation about your study material with an AI tutor.
      </p>
      <p className="mt-3 text-xs font-medium text-purple-700">
        Available on Pro and MAX plans
      </p>
      <Link
        href="/pricing"
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700"
      >
        Upgrade to Pro
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
