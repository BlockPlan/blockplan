"use server";

import { createClient } from "@/lib/supabase/server";
import { generateStudyHelp, type ContentPart } from "@/lib/study-help/generate";
import {
  extractTextFromPdf,
  imageToBase64,
} from "@/lib/study-help/extract";
import type { StudyHelp } from "@/lib/study-help/types";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StudyHelpState = {
  error?: string;
  data?: StudyHelp;
  isMock?: boolean;
  courseName?: string;
  sessionId?: string;
};

// ---------------------------------------------------------------------------
// Server action
// ---------------------------------------------------------------------------

export async function generateStudyHelpAction(
  prevState: StudyHelpState,
  formData: FormData
): Promise<StudyHelpState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Extract form inputs
  const pastedText = (formData.get("notes") as string | null)?.trim() ?? "";
  const courseId = (formData.get("courseId") as string | null)?.trim() || null;
  const storagePathsJson = (formData.get("storagePaths") as string | null) ?? "[]";

  let storagePaths: string[] = [];
  try {
    storagePaths = JSON.parse(storagePathsJson);
  } catch {
    return { error: "Invalid file data" };
  }

  // Validate at least one input source
  if (!pastedText && storagePaths.length === 0) {
    return {
      error:
        "Please provide some content — paste text or upload files.",
    };
  }

  // Validate storage path ownership (security: every path must start with userId/)
  for (const path of storagePaths) {
    if (!path.startsWith(user.id + "/")) {
      return { error: "Invalid file reference" };
    }
  }

  // Resolve course name if courseId provided
  let courseName: string | undefined;
  if (courseId) {
    const { data: course } = await supabase
      .from("courses")
      .select("name")
      .eq("id", courseId)
      .eq("user_id", user.id)
      .single();

    courseName = (course?.name as string) ?? undefined;
  }

  // Build content parts array
  const contentParts: ContentPart[] = [];

  // Process uploaded files
  for (const storagePath of storagePaths) {
    try {
      const ext = storagePath.split(".").pop()?.toLowerCase();

      if (ext === "pdf") {
        const text = await extractTextFromPdf(storagePath);
        if (text.trim().length > 0) {
          contentParts.push({ type: "text", text });
        }
      } else if (["png", "jpg", "jpeg"].includes(ext ?? "")) {
        const dataUrl = await imageToBase64(storagePath);
        contentParts.push({ type: "image", image: dataUrl });
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[study-help] Failed to process file ${storagePath}:`, errMsg);
      // If this was the only input, return a helpful error
      if (!pastedText && storagePaths.length === 1) {
        return {
          error: `Could not process the uploaded file: ${errMsg}. Try pasting text directly instead.`,
        };
      }
      // Otherwise continue with other files
    }
  }

  // Add pasted text
  if (pastedText) {
    contentParts.push({ type: "text", text: pastedText });
  }

  if (contentParts.length === 0) {
    return { error: "Could not extract any content from the provided inputs. Try pasting text directly." };
  }

  // Generate study help
  try {
    const { data, isMock } = await generateStudyHelp(contentParts, courseName);

    // Auto-save to database (non-blocking — user gets results even if save fails)
    let sessionId: string | undefined;
    try {
      const now = new Date();
      const dateLabel = now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const title = courseName
        ? `${courseName} — ${dateLabel}`
        : `Study Session — ${dateLabel}`;

      const { data: inserted } = await supabase
        .from("study_help_sessions")
        .insert({
          user_id: user.id,
          course_id: courseId || null,
          title,
          data,
        })
        .select("id")
        .single();

      sessionId = inserted?.id as string | undefined;
    } catch (saveErr) {
      console.error("[study-help] Failed to save session:", saveErr);
    }

    return { data, isMock, courseName, sessionId };
  } catch (err) {
    console.error("[study-help] Generation failed:", err);
    return { error: "Failed to generate study materials. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// Create a manual study help session (flashcards and/or quiz)
// ---------------------------------------------------------------------------

export async function createManualSession(fields: {
  title: string;
  courseId?: string;
  flashcards: { front: string; back: string }[];
  quiz: { question: string; options: string[]; correctIndex: number; explanation: string }[];
}): Promise<{ sessionId?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const title = fields.title.trim();
  if (!title) return { error: "Title is required." };

  if (fields.flashcards.length === 0 && fields.quiz.length === 0) {
    return { error: "Add at least one flashcard or quiz question." };
  }

  // Build full StudyHelp object with empty sections for non-manual parts
  const data: StudyHelp = {
    summary: [],
    keyTerms: [],
    flashcards: fields.flashcards.filter((c) => c.front.trim() || c.back.trim()),
    quiz: fields.quiz.filter((q) => q.question.trim()),
    practiceTest: [],
  };

  const { data: inserted, error } = await supabase
    .from("study_help_sessions")
    .insert({
      user_id: user.id,
      course_id: fields.courseId || null,
      title,
      data,
    })
    .select("id")
    .single();

  if (error) {
    return { error: "Failed to create session." };
  }

  revalidatePath("/study-help/history");
  return { sessionId: inserted?.id as string };
}

// ---------------------------------------------------------------------------
// Update the study help data (flashcards, quiz, etc.) on an existing session
// ---------------------------------------------------------------------------

export async function updateStudyHelpData(
  sessionId: string,
  updates: {
    flashcards?: { front: string; back: string }[];
    quiz?: { question: string; options: string[]; correctIndex: number; explanation: string }[];
  }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Fetch existing data to merge
  const { data: session } = await supabase
    .from("study_help_sessions")
    .select("data")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (!session) return { error: "Session not found." };

  const existingData = session.data as StudyHelp;
  const merged: StudyHelp = {
    ...existingData,
    ...(updates.flashcards !== undefined && {
      flashcards: updates.flashcards.filter((c) => c.front.trim() || c.back.trim()),
    }),
    ...(updates.quiz !== undefined && {
      quiz: updates.quiz.filter((q) => q.question.trim()),
    }),
  };

  const { error } = await supabase
    .from("study_help_sessions")
    .update({ data: merged })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Failed to update session data." };
  }

  revalidatePath("/study-help/history");
  revalidatePath(`/study-help/${sessionId}`);
  return {};
}

// ---------------------------------------------------------------------------
// Update a saved study help session (title and/or description)
// ---------------------------------------------------------------------------

export async function updateStudyHelpSession(
  sessionId: string,
  fields: { title?: string; description?: string }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const updates: Record<string, string> = {};
  if (fields.title !== undefined) updates.title = fields.title.trim();
  if (fields.description !== undefined) updates.description = fields.description.trim();

  if (Object.keys(updates).length === 0) return {};

  const { error } = await supabase
    .from("study_help_sessions")
    .update(updates)
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Failed to update session." };
  }

  revalidatePath("/study-help/history");
  return {};
}

// ---------------------------------------------------------------------------
// Share a study help session (generate a public share token)
// ---------------------------------------------------------------------------

export async function shareStudyHelpSession(
  sessionId: string
): Promise<{ shareToken?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const token = crypto.randomBytes(16).toString("base64url");

  const { error } = await supabase
    .from("study_help_sessions")
    .update({ share_token: token })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Failed to share session." };
  }

  revalidatePath("/study-help/history");
  revalidatePath(`/study-help/${sessionId}`);
  return { shareToken: token };
}

// ---------------------------------------------------------------------------
// Unshare a study help session (revoke the share link)
// ---------------------------------------------------------------------------

export async function unshareStudyHelpSession(
  sessionId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("study_help_sessions")
    .update({ share_token: null })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Failed to unshare session." };
  }

  revalidatePath("/study-help/history");
  revalidatePath(`/study-help/${sessionId}`);
  return {};
}

// ---------------------------------------------------------------------------
// Delete a saved study help session
// ---------------------------------------------------------------------------

export async function deleteStudyHelpSession(
  sessionId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("study_help_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Failed to delete session." };
  }

  revalidatePath("/study-help/history");
  return {};
}
