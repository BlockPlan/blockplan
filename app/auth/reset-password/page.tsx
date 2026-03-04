"use client";

import { useSearchParams } from "next/navigation";
import { updatePassword } from "../actions";
import { Suspense } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-50">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-blue-50 to-transparent" />

      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-900/5">
        <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          <span className="text-blue-600">Block</span>Plan
        </h1>
        <p className="mt-1 text-center text-sm text-gray-500">
          Set your new password
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {decodeURIComponent(error)}
          </div>
        )}

        <form action={updatePassword} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              New Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="input mt-1"
              placeholder="Min 6 characters"
            />
          </div>

          <button type="submit" className="btn-primary w-full">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-50">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-blue-50 to-transparent" />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-900/5">
            <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">
              <span className="text-blue-600">Block</span>Plan
            </h1>
            <p className="mt-1 text-center text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
