import { z } from "zod";

export const createClassSchema = z.object({
  name: z.string().trim().min(2, "יש להזין שם לכיתה"),
  grade_level: z.string().trim().min(1, "יש לבחור שכבת גיל"),
});

export const GRADE_LEVELS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳"] as const;
