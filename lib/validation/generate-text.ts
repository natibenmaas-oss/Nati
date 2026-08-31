import { z } from "zod";
import { GENRES, DIFFICULTIES, GRADE_LEVELS_FULL } from "@/lib/validation/texts";

export const generateTextFormSchema = z.object({
  gradeLevel: z.enum(GRADE_LEVELS_FULL),
  topic: z.string().trim().min(2, "יש להזין נושא"),
  genre: z.enum(GENRES),
  approxWordCount: z.coerce.number().int().min(50).max(1000),
  difficulty: z.enum(DIFFICULTIES),
  purposeSkillId: z.string().uuid("יש לבחור מטרת תרגול"),
});
