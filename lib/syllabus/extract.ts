import { getDocumentProxy, extractText } from "unpdf";
import { createClient } from "@/lib/supabase/server";
import type { ExtractionResult } from "@/lib/syllabus/types";

/**
 * Downloads a PDF from Supabase Storage and extracts its text content.
 *
 * @param storagePath - Path within the 'syllabi' storage bucket
 * @returns ExtractionResult with extracted text, page count, and isEmpty flag
 */
export async function extractSyllabusText(
  storagePath: string
): Promise<ExtractionResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from("syllabi")
    .download(storagePath);

  if (error || !data) {
    throw new Error(
      `Failed to download syllabus from storage: ${error?.message ?? "No data returned"}`
    );
  }

  // Convert Blob -> ArrayBuffer -> Uint8Array
  const arrayBuffer = await data.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);

  const pdf = await getDocumentProxy(uint8);

  // Try extracting with mergePages: false first to get per-page text,
  // then join with newlines. This often preserves line breaks better
  // than mergePages: true which can concatenate lines.
  const { text: rawText, totalPages } = await extractText(pdf, {
    mergePages: false,
  });

  // extractText returns string[] when mergePages is false (one per page)
  let text: string;
  if (Array.isArray(rawText)) {
    text = rawText.join("\n");
  } else {
    text = rawText;
  }

  // Some PDF extractors produce text without proper line breaks.
  // If the text has very few newlines relative to its length, try to
  // split on common patterns (bullet points, date-prefixed lines).
  const lineCount = text.split("\n").filter((l) => l.trim().length > 0).length;
  if (text.length > 200 && lineCount < 5) {
    console.log("[extract] Very few line breaks detected — attempting to split on bullet patterns");
    // Insert newlines before common bullet/dash patterns
    text = text
      .replace(/\s*[-•]\s+/g, "\n- ")
      .replace(/\s+((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d)/gi, "\n$1");
  }

  console.log("[extract] Raw text type:", typeof rawText, "isArray:", Array.isArray(rawText));
  console.log("[extract] Line count:", text.split("\n").length);

  const isEmpty = text.trim().length < 50;

  return { text, totalPages, isEmpty };
}
