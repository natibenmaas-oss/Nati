import { z } from "zod";
import type { QuestionType } from "@/types/database";

const QUESTION_TYPE_VALUES = [
  "explicit",
  "main_idea",
  "vocabulary",
  "evidence",
  "inference",
  "critical",
  "mcq",
] as const;

export const QUESTION_TYPES: { value: (typeof QUESTION_TYPE_VALUES)[number]; label: string }[] = [
  { value: "explicit", label: "מידע מפורש" },
  { value: "main_idea", label: "רעיון מרכזי" },
  { value: "vocabulary", label: "אוצר מילים" },
  { value: "evidence", label: "הוכחה מהטקסט" },
  { value: "inference", label: "הסקת מסקנות" },
  { value: "critical", label: "חשיבה ביקורתית" },
  { value: "mcq", label: "רב-ברירה (אמריקאית)" },
];

// שאלות "הבנת הטקסט" (שלב 3) מול "אתגר חשיבה" (שלב 4) - סעיף 10 במפרט
export const COMPREHENSION_STEP_TYPES: QuestionType[] = [
  "explicit",
  "main_idea",
  "vocabulary",
  "evidence",
  "mcq",
];
export const CHALLENGE_STEP_TYPES: QuestionType[] = ["inference", "critical"];

export const DIFFICULTIES = ["קל", "בינוני", "מאתגר"] as const;

const mcqOptionSchema = z.object({ key: z.string().min(1), label: z.string().min(1) });

export const createQuestionSchema = z
  .object({
    text_id: z.string().uuid(),
    skill_id: z.string().uuid().optional().or(z.literal("")),
    type: z.enum(QUESTION_TYPE_VALUES),
    question_text: z.string().trim().min(3, "יש להזין את נוסח השאלה"),
    difficulty: z.enum(DIFFICULTIES),
    correct_answer: z.string().trim().optional(),
    options: z.array(mcqOptionSchema).optional(),
  })
  .refine((data) => data.type !== "mcq" || (data.options && data.options.length >= 2), {
    message: "שאלה רב-ברירה חייבת לפחות 2 אפשרויות",
    path: ["options"],
  })
  .refine((data) => data.type !== "mcq" || !!data.correct_answer, {
    message: "יש לבחור את התשובה הנכונה",
    path: ["correct_answer"],
  });
