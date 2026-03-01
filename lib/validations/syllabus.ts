import { z } from "zod";

// Schema for a single parsed syllabus item (used in confirm action)
export const parsedItemSchema = z.object({
  id: z.string().uuid("Must be a valid UUID"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  type: z.enum(["assignment", "exam", "reading", "other"], {
    required_error: "Item type is required",
    invalid_type_error: "Invalid item type",
  }),
  dueDate: z.string().nullable(),
  estimatedMinutes: z.number().int().min(1).max(1440).nullable(),
  points: z.number().nullable(),
  weight: z.number().nullable(),
  needsReview: z.boolean(),
  confidence: z.enum(["high", "medium", "low"]),
  source: z.enum(["rule-based", "llm", "user-added"]),
});

// Schema for the initial PDF upload request
export const uploadRequestSchema = z.object({
  courseId: z.string().uuid("Must be a valid course ID"),
  filename: z
    .string()
    .min(1, "Filename is required")
    .max(255, "Filename must be 255 characters or less")
    .refine((f) => f.toLowerCase().endsWith(".pdf"), {
      message: "File must be a PDF",
    }),
});

// Schema for requesting text extraction from an already-uploaded PDF
export const extractRequestSchema = z.object({
  storagePath: z.string().min(1, "Storage path is required"),
  courseId: z.string().uuid("Must be a valid course ID"),
});

export type ParsedItemInput = z.infer<typeof parsedItemSchema>;
export type UploadRequestInput = z.infer<typeof uploadRequestSchema>;
export type ExtractRequestInput = z.infer<typeof extractRequestSchema>;
