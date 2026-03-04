import { z } from "zod";

// ---------------------------------------------------------------------------
// Upload URL request validation
// ---------------------------------------------------------------------------

export const studyHelpUploadRequestSchema = z.object({
  filename: z
    .string()
    .min(1, "Filename is required")
    .max(255, "Filename too long")
    .refine(
      (f) => /\.(pdf|png|jpe?g)$/i.test(f),
      { message: "File must be PDF, PNG, or JPG" }
    ),
  courseId: z.string().uuid().optional(),
});

export type StudyHelpUploadRequest = z.infer<typeof studyHelpUploadRequestSchema>;

// ---------------------------------------------------------------------------
// YouTube URL validation
// ---------------------------------------------------------------------------

export const youtubeUrlSchema = z
  .string()
  .url("Must be a valid URL")
  .refine(
    (url) =>
      /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)/.test(
        url
      ),
    { message: "Must be a valid YouTube video URL" }
  );
