import { z } from "zod";

export const recurrenceRuleSchema = z.object({
  frequency: z.enum(["daily", "weekly"]),
  days_of_week: z.array(z.number().int().min(0).max(6)).default([]),
  end_date: z.string().min(1, "End date is required"),
}).refine(
  (data) => data.frequency === "daily" || data.days_of_week.length > 0,
  { message: "Select at least one day for weekly recurrence", path: ["days_of_week"] }
);

export type RecurrenceRule = z.infer<typeof recurrenceRuleSchema>;

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
