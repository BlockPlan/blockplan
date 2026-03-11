"use client";

import { useActionState, useState } from "react";
import { submitFeedback, type FeedbackState } from "../actions";

const starLabels = ["Terrible", "Poor", "Okay", "Good", "Amazing"];

export default function FeedbackForm() {
  const [state, formAction, isPending] = useActionState<FeedbackState, FormData>(
    submitFeedback,
    {}
  );
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);

  if (state.success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-green-800">Thank you!</h3>
        <p className="mt-1 text-sm text-green-600">
          Your feedback helps us make BlockPlan better.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 text-sm text-green-700 underline hover:text-green-800"
        >
          Submit more feedback
        </button>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="rating" value={rating} />

      {/* Star rating */}
      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          How would you rate your experience?
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              className="rounded p-1 transition-transform hover:scale-110"
              aria-label={`Rate ${star} out of 5`}
            >
              <svg
                className={`h-8 w-8 transition-colors ${
                  star <= (hoveredStar || rating)
                    ? "text-yellow-400"
                    : "text-gray-200"
                }`}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          ))}
          {(hoveredStar || rating) > 0 && (
            <span className="ml-2 text-sm text-gray-500">
              {starLabels[(hoveredStar || rating) - 1]}
            </span>
          )}
        </div>
        {state.errors?.rating && (
          <p className="mt-1 text-xs text-red-600">{state.errors.rating[0]}</p>
        )}
      </div>

      {/* Message */}
      <div className="mb-5">
        <label htmlFor="message" className="mb-1 block text-sm font-medium text-gray-700">
          What&apos;s on your mind?
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="input"
          placeholder="Tell us what you like, what's confusing, what's broken, or what you wish existed..."
        />
        {state.errors?.message && (
          <p className="mt-1 text-xs text-red-600">{state.errors.message[0]}</p>
        )}
      </div>

      {/* General error */}
      {state.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Submit */}
      <button type="submit" disabled={isPending || rating === 0} className="btn-primary disabled:opacity-50">
        {isPending ? (
          <>
            <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Sending...
          </>
        ) : (
          "Send Feedback"
        )}
      </button>
    </form>
  );
}
