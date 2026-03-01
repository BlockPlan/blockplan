import { z } from "zod";

// Meeting time slot for a course
const meetingTimeSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format"),
});

// Term schema with date refinement
export const termSchema = z
  .object({
    name: z
      .string()
      .min(1, "Term name is required")
      .max(100, "Term name must be 100 characters or less"),
    start_date: z
      .string()
      .min(1, "Start date is required")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a valid date (YYYY-MM-DD)"),
    end_date: z
      .string()
      .min(1, "End date is required")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a valid date (YYYY-MM-DD)"),
  })
  .refine((data) => data.end_date > data.start_date, {
    message: "End date must be after start date",
    path: ["end_date"],
  });

// Course schema with optional meeting times
export const courseSchema = z.object({
  name: z
    .string()
    .min(1, "Course name is required")
    .max(100, "Course name must be 100 characters or less"),
  meeting_times: z.array(meetingTimeSchema).optional(),
});

// Inferred TypeScript types
export type TermInput = z.infer<typeof termSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type MeetingTime = z.infer<typeof meetingTimeSchema>;
