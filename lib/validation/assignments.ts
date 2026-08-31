import { z } from "zod";

export const createAssignmentSchema = z.object({
  class_id: z.string().uuid("יש לבחור כיתה"),
  text_id: z.string().uuid("יש לבחור טקסט"),
  title: z.string().trim().min(2, "יש להזין כותרת למשימה"),
  instructions: z.string().trim().optional(),
  skill_focus: z.array(z.string().uuid()).default([]),
  due_date: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined)),
});
