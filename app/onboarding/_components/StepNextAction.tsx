"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StepNextAction() {
  const router = useRouter();

  function handleAddTasksManually() {
    router.push("/tasks");
  }

  return (
    <div className="py-4">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-7 w-7 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          You&apos;re all set!
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Your term, courses, and availability are ready. Choose how you&apos;d
          like to get started:
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Add Tasks Manually — primary action */}
        <button
          type="button"
          onClick={handleAddTasksManually}
          className={[
            "group relative flex flex-col items-start gap-2 rounded-lg border-2 border-blue-600 bg-white p-5",
            "text-left shadow-sm transition-colors hover:bg-blue-50",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          ].join(" ")}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-100 group-hover:bg-blue-200 transition-colors">
            <svg
              className="h-5 w-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Add Tasks Manually
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              Enter your assignments, exams, and readings one by one.
            </p>
          </div>
        </button>

        {/* Upload Syllabi — active, routes to /syllabi/upload */}
        <Link
          href="/syllabi/upload"
          className={[
            "group relative flex flex-col items-start gap-2 rounded-lg border-2 border-blue-600 bg-white p-5",
            "text-left shadow-sm transition-colors hover:bg-blue-50",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          ].join(" ")}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-100 group-hover:bg-blue-200 transition-colors">
            <svg
              className="h-5 w-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Upload Syllabi
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              Automatically import tasks from your course syllabi.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
