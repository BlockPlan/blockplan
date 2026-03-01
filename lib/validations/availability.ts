import { z } from "zod";

const timeRegex = /^\d{2}:\d{2}$/;

export const availabilityRuleSchema = z
  .object({
    day_of_week: z.number().int().min(0).max(6),
    start_time: z
      .string()
      .regex(timeRegex, "Must be HH:MM format"),
    end_time: z
      .string()
      .regex(timeRegex, "Must be HH:MM format"),
    rule_type: z.enum(["available", "blocked", "preferred"]),
    label: z.string().optional(),
  })
  .refine(
    (rule) => rule.end_time > rule.start_time,
    { message: "End time must be after start time", path: ["end_time"] }
  )
  .refine(
    (rule) => rule.rule_type === "blocked" || !rule.label || rule.label === "",
    { message: "Labels are only for blocked time slots", path: ["label"] }
  );

export type AvailabilityRule = z.infer<typeof availabilityRuleSchema>;

// Helper: check if two time ranges overlap on the same day
function timesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export const availabilityRulesArraySchema = z
  .array(availabilityRuleSchema)
  .refine(
    (rules) => {
      for (let i = 0; i < rules.length; i++) {
        for (let j = i + 1; j < rules.length; j++) {
          const a = rules[i];
          const b = rules[j];
          if (a.day_of_week === b.day_of_week) {
            if (timesOverlap(a.start_time, a.end_time, b.start_time, b.end_time)) {
              return false;
            }
          }
        }
      }
      return true;
    },
    {
      message:
        "Two or more rules overlap on the same day. Please resolve overlapping time slots.",
    }
  );
