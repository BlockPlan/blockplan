import { z } from "zod";

// Default estimated minutes per task type
export const DEFAULT_MINUTES = {
  assignment: 120,
  exam: 180,
  reading: 60,
  other: 60,
} as const;

export type TaskType = keyof typeof DEFAULT_MINUTES;

// Schema for creating a new task
export const taskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  type: z.enum(["assignment", "exam", "reading", "other"], {
    required_error: "Task type is required",
    invalid_type_error: "Invalid task type",
  }),
  due_date: z.string().optional(),
  estimated_minutes: z
    .string()
    .optional()
    .transform((val) => (val && val.trim() !== "" ? Number(val) : undefined))
    .pipe(
      z
        .number()
        .int("Must be a whole number")
        .min(1, "Must be at least 1 minute")
        .max(1440, "Cannot exceed 1440 minutes (24 hours)")
        .optional()
    ),
  course_id: z
    .string()
    .uuid("Must be a valid course ID")
    .min(1, "Course is required"),
});

// Schema for updating an existing task (all optional, id required)
export const taskUpdateSchema = z.object({
  id: z.string().uuid("Must be a valid task ID"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .optional(),
  type: z
    .enum(["assignment", "exam", "reading", "other"], {
      invalid_type_error: "Invalid task type",
    })
    .optional(),
  due_date: z.string().optional(),
  estimated_minutes: z
    .string()
    .optional()
    .transform((val) => (val && val.trim() !== "" ? Number(val) : undefined))
    .pipe(
      z
        .number()
        .int("Must be a whole number")
        .min(1, "Must be at least 1 minute")
        .max(1440, "Cannot exceed 1440 minutes (24 hours)")
        .optional()
    ),
  course_id: z.string().uuid("Must be a valid course ID").optional(),
});

// Inferred TypeScript types
export type TaskInput = z.infer<typeof taskSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
