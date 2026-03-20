/**
 * Shared utility for classifying and handling OpenAI API errors.
 *
 * Returns user-friendly messages without exposing internal details
 * (API keys, raw error objects, stack traces).
 */

// ---------------------------------------------------------------------------
// Error classification
// ---------------------------------------------------------------------------

export type AIErrorType =
  | "insufficient_balance"
  | "rate_limit"
  | "api_down"
  | "invalid_key"
  | "content_filter"
  | "context_length"
  | "unknown";

export interface ClassifiedAIError {
  type: AIErrorType;
  /** Safe message to show to the end user */
  userMessage: string;
  /** Whether the caller should retry (e.g. rate limit, transient failure) */
  retryable: boolean;
}

const ERROR_MAP: Record<AIErrorType, Omit<ClassifiedAIError, "type">> = {
  insufficient_balance: {
    userMessage:
      "Our AI service is temporarily unavailable. Please try again later.",
    retryable: false,
  },
  rate_limit: {
    userMessage:
      "Too many requests. Please wait a moment and try again.",
    retryable: true,
  },
  api_down: {
    userMessage:
      "AI service is temporarily unavailable. Please try again in a few minutes.",
    retryable: true,
  },
  invalid_key: {
    userMessage:
      "AI service configuration error. Please contact support.",
    retryable: false,
  },
  content_filter: {
    userMessage:
      "The content was flagged by our safety filter. Please revise your input and try again.",
    retryable: false,
  },
  context_length: {
    userMessage:
      "The input is too long for our AI to process. Please shorten it and try again.",
    retryable: false,
  },
  unknown: {
    userMessage:
      "Something went wrong with the AI service. Please try again.",
    retryable: true,
  },
};

// ---------------------------------------------------------------------------
// Classifier
// ---------------------------------------------------------------------------

/**
 * Classify an error thrown by an OpenAI / AI SDK call into a user-safe
 * category with a friendly message.
 *
 * Works with:
 * - `openai` SDK errors (have `status`, `code`, `type` fields)
 * - `ai` Vercel SDK errors (wraps the underlying provider error)
 * - Generic `Error` objects with status-like messages
 */
export function classifyAIError(err: unknown): ClassifiedAIError {
  // Extract useful fields from any error shape
  const status = getNumericField(err, "status");
  const code = getStringField(err, "code");
  const type = getStringField(err, "type");
  const message = err instanceof Error ? err.message : String(err);

  // --- Specific status codes ---

  if (status === 401 || code === "invalid_api_key") {
    return { type: "invalid_key", ...ERROR_MAP.invalid_key };
  }

  if (
    status === 402 ||
    code === "insufficient_quota" ||
    type === "insufficient_quota" ||
    message.includes("insufficient_quota") ||
    message.includes("billing") ||
    message.includes("exceeded your current quota")
  ) {
    return { type: "insufficient_balance", ...ERROR_MAP.insufficient_balance };
  }

  if (
    status === 429 ||
    code === "rate_limit_exceeded" ||
    type === "tokens" ||
    message.includes("rate limit") ||
    message.includes("Rate limit")
  ) {
    return { type: "rate_limit", ...ERROR_MAP.rate_limit };
  }

  if (
    code === "content_filter" ||
    message.includes("content_policy_violation") ||
    message.includes("content management policy") ||
    message.includes("safety system")
  ) {
    return { type: "content_filter", ...ERROR_MAP.content_filter };
  }

  if (
    code === "context_length_exceeded" ||
    message.includes("maximum context length") ||
    message.includes("context_length_exceeded")
  ) {
    return { type: "context_length", ...ERROR_MAP.context_length };
  }

  if (
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    code === "server_error" ||
    message.includes("ECONNREFUSED") ||
    message.includes("ETIMEDOUT") ||
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("timeout")
  ) {
    return { type: "api_down", ...ERROR_MAP.api_down };
  }

  // Fallback
  return { type: "unknown", ...ERROR_MAP.unknown };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Safely read a numeric property from an unknown value */
function getNumericField(obj: unknown, key: string): number | undefined {
  if (obj && typeof obj === "object" && key in obj) {
    const val = (obj as Record<string, unknown>)[key];
    return typeof val === "number" ? val : undefined;
  }
  return undefined;
}

/** Safely read a string property from an unknown value */
function getStringField(obj: unknown, key: string): string | undefined {
  if (obj && typeof obj === "object" && key in obj) {
    const val = (obj as Record<string, unknown>)[key];
    return typeof val === "string" ? val : undefined;
  }
  return undefined;
}
