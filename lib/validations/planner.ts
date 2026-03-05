import { z } from "zod";

export const plannerSettingsSchema = z
  .object({
    max_block_minutes: z.number().int().min(25).max(120).default(90),
    min_block_minutes: z.number().int().min(15).max(60).default(25),
    buffer_minutes: z.number().int().min(0).max(30).default(10),
    backward_planning: z.boolean().default(false),
  })
  .refine((data) => data.min_block_minutes <= data.max_block_minutes, {
    message: "Min block length must be less than or equal to max block length",
    path: ["min_block_minutes"],
  });

export type PlannerSettings = z.infer<typeof plannerSettingsSchema>;

export const DEFAULT_PLANNER_SETTINGS: PlannerSettings = {
  max_block_minutes: 90,
  min_block_minutes: 25,
  buffer_minutes: 10,
  backward_planning: false,
};
