import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@/lib/supabase/server";

/**
 * Downloads an image from Supabase Storage and extracts syllabus text
 * using OpenAI Vision (gpt-4o-mini).
 *
 * @param storagePath - Path within the 'syllabi' storage bucket
 * @returns Extracted text from the image
 */
export async function extractSyllabusTextFromImage(
  storagePath: string
): Promise<{ text: string; isEmpty: boolean }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is required for image extraction.");
  }

  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from("syllabi")
    .download(storagePath);

  if (error || !data) {
    throw new Error(
      `Failed to download image from storage: ${error?.message ?? "No data returned"}`
    );
  }

  // Convert to base64 data URL
  const arrayBuffer = await data.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  const base64 = Buffer.from(uint8).toString("base64");

  const ext = storagePath.split(".").pop()?.toLowerCase() ?? "png";
  const mimeType =
    ext === "jpg" || ext === "jpeg"
      ? "image/jpeg"
      : "image/png";
  const dataUrl = `data:${mimeType};base64,${base64}`;

  // Use OpenAI Vision to extract text from the image
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract ALL text from this syllabus image. Reproduce the text exactly as it appears, preserving structure, dates, assignment names, and due dates. Output only the extracted text, nothing else.",
          },
          {
            type: "image",
            image: dataUrl,
          },
        ],
      },
    ],
  });

  const isEmpty = text.trim().length < 50;

  return { text, isEmpty };
}
