import { getDocumentProxy, extractText } from "unpdf";
import { createClient } from "@/lib/supabase/server";
import { createYouTubeTranscriptApi } from "@playzone/youtube-transcript/dist/api/index.js";

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let snippets: any[] | undefined;

  // Method 1: Try @playzone/youtube-transcript library
  try {
    const api = createYouTubeTranscriptApi();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await api.fetch(videoId);
    snippets = result?.snippets;
  } catch (err) {
    console.warn("[youtube-transcript] Library method failed:", err instanceof Error ? err.message : err);
  }

  // Method 2: Fallback — scrape caption XML from YouTube page
  if (!snippets || !Array.isArray(snippets) || snippets.length === 0) {
    try {
      snippets = await fetchCaptionsDirect(videoId);
    } catch (err) {
      console.warn("[youtube-transcript] Direct method failed:", err instanceof Error ? err.message : err);
    }
  }

  if (!snippets || snippets.length === 0) {
    throw new Error(
      "Could not extract transcript from this video. YouTube may be blocking server-side requests. " +
      "Try copying the video transcript manually: open the video on YouTube → click '...' below the video → 'Show transcript' → copy the text → paste it in the notes field."
    );
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

/**
 * Fallback: fetch captions directly from YouTube's timedtext API
 * by scraping the video page for caption track URLs.
 */
async function fetchCaptionsDirect(
  videoId: string
): Promise<Array<{ text: string }>> {
  const pageResponse = await fetch(
    `https://www.youtube.com/watch?v=${videoId}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Cookie: "CONSENT=YES+1",
      },
    }
  );

  if (!pageResponse.ok) {
    throw new Error(`Failed to fetch YouTube page: ${pageResponse.status}`);
  }

  const html = await pageResponse.text();

  const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
  if (!captionMatch) {
    throw new Error("No captions available for this video");
  }

  const captionTracks: Array<{ baseUrl: string; languageCode: string }> =
    JSON.parse(captionMatch[1]);

  if (!captionTracks || captionTracks.length === 0) {
    throw new Error("No caption tracks found");
  }

  // Prefer English
  const track =
    captionTracks.find((t) => t.languageCode?.startsWith("en")) ??
    captionTracks[0];

  const captionResponse = await fetch(track.baseUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Referer: `https://www.youtube.com/watch?v=${videoId}`,
      Origin: "https://www.youtube.com",
    },
  });

  const captionXml = await captionResponse.text();

  if (!captionXml || captionXml.length === 0) {
    throw new Error("Caption response was empty — YouTube may be blocking server-side requests");
  }

  const segments: Array<{ text: string }> = [];
  const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
  let m;
  while ((m = textRegex.exec(captionXml)) !== null) {
    const text = m[1].trim();
    if (text) segments.push({ text });
  }

  if (segments.length === 0) {
    throw new Error("Caption track returned but contained no text");
  }

  return segments;
}
