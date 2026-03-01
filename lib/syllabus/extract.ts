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
  const { text: rawText, totalPages } = await extractText(pdf, {
    mergePages: true,
  });

  // extractText may return string or string[] depending on mergePages
  const text = Array.isArray(rawText) ? rawText.join("\n") : rawText;

  const isEmpty = text.trim().length < 50;

  return { text, totalPages, isEmpty };
}
