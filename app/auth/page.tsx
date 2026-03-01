"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signup, signin } from "./actions";
import { Suspense } from "react";

function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
          BlockPlan
        </h1>

        {/* Tab Toggle */}
        <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setMode("signin")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              mode === "signin"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              mode === "signup"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Success Message */}
        {message === "deleted" && (
          <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
            Account deleted successfully.
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {decodeURIComponent(error)}
          </div>
        )}

        {/* Form */}
        <form action={mode === "signin" ? signin : signup} className="space-y-4">
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
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

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
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Min 6 characters"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {mode === "signin" ? "Sign In" : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
          <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">BlockPlan</h1>
          <p className="text-center text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
