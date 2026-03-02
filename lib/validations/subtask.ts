import { z } from "zod";

export const subtaskSchema = z.object({
  task_id: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
  due_date: z.string().optional(),
  estimated_minutes: z.number().int().min(1, "Must be at least 1 minute").max(1440, "Cannot exceed 1440 minutes"),
  sort_order: z.number().int().min(0),
});

export type SubtaskInput = z.infer<typeof subtaskSchema>;
