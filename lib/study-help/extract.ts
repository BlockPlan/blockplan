import { getDocumentProxy, extractText } from "unpdf";
import { createYouTubeTranscriptApi } from "@playzone/youtube-transcript/dist/api/index.js";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// PDF text extraction — reuses unpdf pattern from lib/syllabus/extract.ts
// ---------------------------------------------------------------------------

/**
 * Downloads a PDF from the study_materials storage bucket and extracts text.
 */
export async function extractTextFromPdf(storagePath: string): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from("study_materials")
    .download(storagePath);

  if (error || !data) {
    throw new Error(
      `Failed to download study material from storage: ${error?.message ?? "No data returned"}`
    );
  }

  const arrayBuffer = await data.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);

  const pdf = await getDocumentProxy(uint8);
  const { text: rawText } = await extractText(pdf, { mergePages: false });

  let text: string;
  if (Array.isArray(rawText)) {
    text = rawText.join("\n");
  } else {
    text = rawText;
  }

  // Handle PDFs with very few newlines
  const lineCount = text.split("\n").filter((l) => l.trim().length > 0).length;
  if (text.length > 200 && lineCount < 5) {
    text = text
      .replace(/\s*[-\u2022]\s+/g, "\n- ")
      .replace(
        /\s+((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d)/gi,
        "\n$1"
      );
  }

  return text;
}

// ---------------------------------------------------------------------------
// Image to base64 — downloads from storage and converts for GPT-4o vision
// ---------------------------------------------------------------------------

/**
 * Downloads an image from the study_materials storage bucket and converts
 * it to a base64 data URL for use with GPT-4o-mini vision.
 */
export async function imageToBase64(storagePath: string): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from("study_materials")
    .download(storagePath);

  if (error || !data) {
    throw new Error(
      `Failed to download image from storage: ${error?.message ?? "No data returned"}`
    );
  }

  const arrayBuffer = await data.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  const base64 = Buffer.from(uint8).toString("base64");

  // Detect MIME type from extension
  const ext = storagePath.split(".").pop()?.toLowerCase();
  let mime = "image/jpeg";
  if (ext === "png") mime = "image/png";
  else if (ext === "jpg" || ext === "jpeg") mime = "image/jpeg";

  return `data:${mime};base64,${base64}`;
}

// ---------------------------------------------------------------------------
// YouTube transcript extraction — fetches captions without API key
// ---------------------------------------------------------------------------

/**
 * Fetches the transcript/captions from a YouTube video and returns
 * the full text as a single string. Accepts full YouTube URLs or
 * short youtu.be links.
 */
export async function extractTranscriptFromYouTube(
  videoUrl: string
): Promise<string> {
  // Extract video ID from URL
  const match = videoUrl.match(
    /(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/
  );
  if (!match) {
    throw new Error("Could not extract video ID from URL");
  }
  const videoId = match[1];

  const api = createYouTubeTranscriptApi();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = await api.fetch(videoId);

  const snippets = result?.snippets;
  if (!snippets || !Array.isArray(snippets) || snippets.length === 0) {
    throw new Error("No transcript available for this video");
  }

  // Join all caption segments into continuous text
  const text = snippets.map((s: { text: string }) => s.text).join(" ");

  // Clean up common HTML entities that appear in YouTube captions
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n/g, " ");
}
