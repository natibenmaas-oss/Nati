import { z } from "zod";

export const GENRES = [
  "סיפור",
  "מידע",
  "מדע",
  "היסטוריה",
  "אקטואליה",
  "טקסט דמיוני",
  "טקסט עיוני",
] as const;

export const DIFFICULTIES = ["קל", "בינוני", "מאתגר"] as const;
export const GRADE_LEVELS_FULL = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳"] as const;
export const VOCAB_LEVELS = ["בסיסי", "בינוני", "עשיר"] as const;

export const createTextSchema = z.object({
  title: z.string().trim().min(2, "יש להזין כותרת"),
  content: z.string().trim().min(50, "הטקסט קצר מדי (לפחות 50 תווים)"),
  grade_level: z.enum(GRADE_LEVELS_FULL),
  difficulty: z.enum(DIFFICULTIES),
  genre: z.enum(GENRES),
  estimated_reading_time: z.coerce.number().int().min(1).max(60),
  vocabulary_level: z.enum(VOCAB_LEVELS),
  cover_icon: z.string().trim().min(1).max(4),
  tags: z
    .string()
    .transform((v) =>
      v
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    )
    .default([]),
  // עד 3 מילות אוצר מילים, כל אחת עם הגדרה
  vocab_word_1: z.string().trim().optional(),
  vocab_definition_1: z.string().trim().optional(),
  vocab_word_2: z.string().trim().optional(),
  vocab_definition_2: z.string().trim().optional(),
  vocab_word_3: z.string().trim().optional(),
  vocab_definition_3: z.string().trim().optional(),
});
