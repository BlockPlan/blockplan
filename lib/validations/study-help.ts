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
      (f) => /\.(pdf|pptx?|docx?|png|jpe?g)$/i.test(f),
      { message: "File must be PDF, PPT, PPTX, DOC, DOCX, PNG, or JPG" }
    ),
  courseId: z.string().uuid().optional(),
});

export type StudyHelpUploadRequest = z.infer<typeof studyHelpUploadRequestSchema>;
