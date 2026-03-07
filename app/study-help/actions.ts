"use server";

import { createClient } from "@/lib/supabase/server";
import { generateStudyHelp, regenerateStudyHelp, type ContentPart } from "@/lib/study-help/generate";
import {
  extractTextFromPdf,
  extractTextFromPptx,
  imageToBase64,
} from "@/lib/study-help/extract";
import type { StudyHelp, RegeneratableSection } from "@/lib/study-help/types";
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

      if (ext === "ppt") {
        // Old binary .ppt format is not supported — tell user to convert
        if (!pastedText && storagePaths.length === 1) {
          return {
            error: "Old .ppt format is not supported. Please save as .pptx in PowerPoint (File → Save As → .pptx) and re-upload.",
          };
        }
        console.warn(`[study-help] Skipping unsupported .ppt file: ${storagePath}`);
        continue;
      } else if (ext === "pdf") {
        const text = await extractTextFromPdf(storagePath);
        if (text.trim().length > 0) {
          contentParts.push({ type: "text", text });
        } else {
          console.warn(`[study-help] PDF extraction returned empty text: ${storagePath}`);
        }
      } else if (ext === "pptx") {
        const text = await extractTextFromPptx(storagePath);
        if (text.trim().length > 0) {
          contentParts.push({ type: "text", text });
        } else {
          console.warn(`[study-help] PPTX extraction returned empty text: ${storagePath}`);
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
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[study-help] Generation failed:", errMsg);
    return { error: `Failed to generate study materials: ${errMsg}` };
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

// ---------------------------------------------------------------------------
// Flashcard spaced-repetition helpers
// ---------------------------------------------------------------------------

export interface CardProgress {
  box: number;
  reviewCount: number;
  lastReviewed: string | null;
}

export async function getFlashcardProgress(
  sessionId: string
): Promise<{ progress: Record<number, CardProgress>; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { progress: {}, error: "Not authenticated" };

  const { data: rows, error } = await supabase
    .from("flashcard_reviews")
    .select("card_index, box, review_count, last_reviewed")
    .eq("user_id", user.id)
    .eq("session_id", sessionId);

  if (error) return { progress: {}, error: "Failed to load progress." };

  const progress: Record<number, CardProgress> = {};
  for (const r of rows ?? []) {
    progress[r.card_index as number] = {
      box: r.box as number,
      reviewCount: r.review_count as number,
      lastReviewed: r.last_reviewed as string | null,
    };
  }
  return { progress };
}

export async function saveFlashcardResults(
  sessionId: string,
  results: { cardIndex: number; result: "got_it" | "learning" }[]
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Fetch existing progress to compute new box values
  const { data: existing } = await supabase
    .from("flashcard_reviews")
    .select("card_index, box, review_count")
    .eq("user_id", user.id)
    .eq("session_id", sessionId);

  const existingMap = new Map<number, { box: number; reviewCount: number }>();
  for (const r of existing ?? []) {
    existingMap.set(r.card_index as number, {
      box: r.box as number,
      reviewCount: r.review_count as number,
    });
  }

  const now = new Date().toISOString();

  const upserts = results.map((r) => {
    const prev = existingMap.get(r.cardIndex);
    const prevBox = prev?.box ?? 1;
    const prevCount = prev?.reviewCount ?? 0;
    const newBox =
      r.result === "got_it" ? Math.min(prevBox + 1, 5) : 1;

    return {
      user_id: user.id,
      session_id: sessionId,
      card_index: r.cardIndex,
      box: newBox,
      review_count: prevCount + 1,
      last_reviewed: now,
    };
  });

  const { error } = await supabase
    .from("flashcard_reviews")
    .upsert(upserts, { onConflict: "user_id,session_id,card_index" });

  if (error) return { error: "Failed to save results." };

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

// ---------------------------------------------------------------------------
// Regenerate flashcards, quiz, and/or practice test with new questions
// ---------------------------------------------------------------------------

export async function regenerateStudyMaterial(
  sessionId: string,
  existingData: StudyHelp,
  sections: RegeneratableSection[],
  courseName?: string
): Promise<{ data?: Partial<StudyHelp>; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Verify session ownership
  const { data: session } = await supabase
    .from("study_help_sessions")
    .select("id, data")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (!session) return { error: "Session not found." };

  // Generate new questions
  const { data: regenerated, isMock } = await regenerateStudyHelp(
    existingData,
    sections,
    courseName
  );

  if (isMock && process.env.OPENAI_API_KEY) {
    return { error: "Failed to generate new questions. Please try again." };
  }

  // Merge regenerated sections into existing session data
  const currentData = session.data as StudyHelp;
  const merged: StudyHelp = { ...currentData, ...regenerated };

  const { error } = await supabase
    .from("study_help_sessions")
    .update({ data: merged })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Failed to save regenerated questions." };
  }

  revalidatePath("/study-help/history");
  revalidatePath(`/study-help/${sessionId}`);

  return { data: regenerated };
}
