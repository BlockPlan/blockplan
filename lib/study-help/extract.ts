import { getDocumentProxy, extractText } from "unpdf";
import { parseOffice } from "officeparser";
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
// PPTX text extraction — uses officeparser to extract slide text + notes
// ---------------------------------------------------------------------------

/**
 * Downloads a PPTX from the study_materials storage bucket and extracts text
 * including speaker notes.
 */
export async function extractTextFromPptx(storagePath: string): Promise<string> {
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
  const buffer = Buffer.from(arrayBuffer);

  const result = await parseOffice(buffer, {
    ignoreNotes: false,
    putNotesAtLast: false,
    newlineDelimiter: "\n",
  });

  // parseOffice returns an object with a toText() method, not a plain string
  if (result && typeof result === "object" && typeof result.toText === "function") {
    return result.toText();
  }
  // Fallback for older versions that may return a string directly
  return typeof result === "string" ? result : String(result);
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

