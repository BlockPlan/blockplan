"use server";

import { createClient } from "@/lib/supabase/server";
import { generateStudyHelp, type ContentPart } from "@/lib/study-help/generate";
import {
  extractTextFromPdf,
  imageToBase64,
  extractTranscriptFromYouTube,
} from "@/lib/study-help/extract";
import { youtubeUrlSchema } from "@/lib/validations/study-help";
import type { StudyHelp } from "@/lib/study-help/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StudyHelpState = {
  error?: string;
  data?: StudyHelp;
  isMock?: boolean;
  courseName?: string;
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
  const videoUrl = (formData.get("videoUrl") as string | null)?.trim() ?? "";
  const storagePathsJson = (formData.get("storagePaths") as string | null) ?? "[]";

  let storagePaths: string[] = [];
  try {
    storagePaths = JSON.parse(storagePathsJson);
  } catch {
    return { error: "Invalid file data" };
  }

  // Validate at least one input source
  if (!pastedText && storagePaths.length === 0 && !videoUrl) {
    return {
      error:
        "Please provide some content — paste text, upload files, or add a YouTube link.",
    };
  }

  // Validate YouTube URL format if provided
  if (videoUrl) {
    const urlCheck = youtubeUrlSchema.safeParse(videoUrl);
    if (!urlCheck.success) {
      return {
        error:
          "Please enter a valid YouTube URL (e.g. https://www.youtube.com/watch?v=...)",
      };
    }
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
      if (!pastedText && storagePaths.length === 1 && !videoUrl) {
        return {
          error: `Could not process the uploaded file: ${errMsg}. Try pasting text directly instead.`,
        };
      }
      // Otherwise continue with other files
    }
  }

  // Process YouTube video URL
  if (videoUrl) {
    try {
      let transcript = await extractTranscriptFromYouTube(videoUrl);

      // Clean up transcript noise: music symbols, sound effects, etc.
      transcript = transcript
        .replace(/♪[^♪]*♪/g, "") // Remove ♪ music segments ♪
        .replace(/[♪♫]/g, "") // Remove stray music symbols
        .replace(/\[.*?\]/g, "") // Remove [Music], [Applause], etc.
        .replace(/\(.*?\)/g, "") // Remove (inaudible), (laughs), etc.
        .replace(/\s{2,}/g, " ") // Collapse extra whitespace
        .trim();

      if (transcript.length > 0) {
        contentParts.push({
          type: "text",
          text: `[YouTube Video Transcript]\n${transcript}`,
        });
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[study-help] Failed to extract YouTube transcript:", errMsg);
      // If YouTube was the only input, return a helpful error
      if (!pastedText && storagePaths.length === 0) {
        return {
          error: `Could not extract transcript from this YouTube video: ${errMsg}. Try pasting your notes or text directly instead.`,
        };
      }
      // Otherwise continue with other inputs
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
    return { data, isMock, courseName };
  } catch (err) {
    console.error("[study-help] Generation failed:", err);
    return { error: "Failed to generate study materials. Please try again." };
  }
}
