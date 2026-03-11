"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const feedbackSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  message: z.string().min(5, "Please write at least a few words"),
  page: z.string().optional(),
});

export interface FeedbackState {
  errors?: Partial<Record<"rating" | "message", string[]>>;
  error?: string;
  success?: boolean;
}

export async function submitFeedback(
  _prevState: FeedbackState,
  formData: FormData
): Promise<FeedbackState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const parsed = feedbackSchema.safeParse({
    rating: formData.get("rating"),
    message: formData.get("message"),
    page: formData.get("page") || undefined,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as FeedbackState["errors"] };
  }

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    rating: parsed.data.rating,
    message: parsed.data.message,
    page: parsed.data.page ?? null,
  });

  if (error) {
    return { error: "Failed to submit feedback. Please try again." };
  }

  return { success: true };
}
