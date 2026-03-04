"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signup, signin, requestPasswordReset } from "./actions";
import { Suspense } from "react";

function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-50">
      {/* Decorative gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-blue-50 to-transparent" />

      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-900/5">
        <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          <span className="text-blue-600">Block</span>Plan
        </h1>
        <p className="mt-1 text-center text-sm text-gray-500">
          Your academic planner
        </p>

        {/* Tab Toggle */}
        <div className="mb-6 mt-6 flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setMode("signin")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all duration-200 ${
              mode === "signin"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all duration-200 ${
              mode === "signup"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Success Message */}
        {message && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {message === "deleted" ? "Account deleted successfully." : decodeURIComponent(message)}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {decodeURIComponent(error)}
          </div>
        )}

        {/* Form */}
        <form
          action={
            mode === "forgot"
              ? requestPasswordReset
              : mode === "signin"
                ? signin
                : signup
          }
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="input mt-1"
              placeholder="you@example.com"
            />
          </div>

          {mode !== "forgot" && (
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
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
          )}

          <button
            type="submit"
            className="btn-primary w-full"
          >
            {mode === "forgot"
              ? "Send Reset Link"
              : mode === "signin"
                ? "Sign In"
                : "Sign Up"}
          </button>
        </form>

        {/* Forgot password link */}
        {mode === "signin" && (
          <button
            onClick={() => setMode("forgot")}
            className="mt-3 block w-full text-center text-sm text-blue-600 hover:text-blue-800"
          >
            Forgot your password?
          </button>
        )}
        {mode === "forgot" && (
          <button
            onClick={() => setMode("signin")}
            className="mt-3 block w-full text-center text-sm text-gray-500 hover:text-gray-700"
          >
            Back to Sign In
          </button>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-50">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-blue-50 to-transparent" />
        <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-900/5">
          <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            <span className="text-blue-600">Block</span>Plan
          </h1>
          <p className="mt-1 text-center text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
