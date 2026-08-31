import { z } from "zod";

/**
 * הפלט המובנה של evaluateAnswer (סעיף 13 במפרט). נשמר כפי שהוא ב-answers.ai_feedback.
 * ה-descriptions מועברים בפועל למודל כחלק מה-JSON schema (structured outputs) -
 * הם לא רק תיעוד לקוד.
 */
export const evaluateAnswerOutputSchema = z.object({
  score: z.number().min(0).max(100).describe("ציון 0-100 המשקף עד כמה התשובה נכונה ומבוססת על הטקסט"),
  correct: z.boolean().describe("האם התשובה נכונה באופן מהותי (גם אם לא מנוסחת בצורה מושלמת)"),
  reasoning: z.string().describe("הסבר קצר (למורה) לשיפוט - למה ניתן הציון הזה"),
  missing_elements: z
    .array(z.string())
    .describe("מרכיבים חשובים שחסרים בתשובה, אם יש (רשימה ריקה אם התשובה מלאה)"),
  feedback: z
    .string()
    .describe("משוב קצר, חיובי ומותאם לילד/ה בבית ספר יסודי, בעברית, ללא מתן התשובה הנכונה"),
  next_step: z
    .string()
    .describe("המלצה קצרה מה כדאי לתלמיד/ה לעשות עכשיו (למשל: לנסות שוב, לבקש רמז, להמשיך)"),
});
export type EvaluateAnswerOutput = z.infer<typeof evaluateAnswerOutputSchema>;

export const generateHintOutputSchema = z.object({
  hint: z.string().describe("רמז קצר, בעברית, מותאם לילד/ה - לא חושף את התשובה הנכונה"),
  is_final_explanation: z
    .boolean()
    .describe("true רק אם זהו הרמז השלישי ואילך, ולכן מותר להסביר את התשובה בעדינות"),
});
export type GenerateHintOutput = z.infer<typeof generateHintOutputSchema>;

/**
 * הפלט המובנה של analyzeStudent (סעיף 9 במפרט - מנוע ההתאמה האישית).
 * מוצג למורה בפרופיל הקורא של התלמיד/ה ("המלצת AI", סעיף 6).
 */
export const analyzeStudentOutputSchema = z.object({
  summary: z
    .string()
    .describe("2-3 משפטים המתארים את מצב הקריאה הנוכחי של התלמיד/ה - חוזקות ותחומים לחיזוק"),
  recommendation: z
    .string()
    .describe("המלצה פדגוגית קונקרטית וקצרה למורה - מה כדאי לתרגל עם התלמיד/ה ואיך"),
  focus_skill_key: z
    .string()
    .describe("מפתח המיומנות (מתוך הרשימה שסופקה) שהכי כדאי להתמקד בה עכשיו"),
});
export type AnalyzeStudentOutput = z.infer<typeof analyzeStudentOutputSchema>;

/**
 * הפלט המובנה של generateWeeklyReport (סעיף 20 במפרט - סיכום שבועי למורה).
 */
export const weeklyReportOutputSchema = z.object({
  headline: z.string().describe("משפט פתיחה קצר שמסכם את השבוע (חיובי/מעודד גם אם התוצאות מעורבות)"),
  highlights: z
    .array(z.string())
    .describe("2-4 נקודות עובדתיות קצרות המבוססות אך ורק על הנתונים שסופקו (למשל: 'X תלמידים השתפרו ב-Y')"),
  recommendation: z.string().describe("המלצה מעשית אחת לשבוע הבא, קצרה וברורה"),
});
export type WeeklyReportOutput = z.infer<typeof weeklyReportOutputSchema>;

/**
 * הפלט המובנה של generateTextWithQuestions (סעיף 8 במפרט - AI Text Generator).
 * מייצר בקריאה אחת גם את הטקסט וגם את מערך השאלות הנלוות, לפי סוגי השאלות
 * הנדרשים: מידע מפורש/הבנה, הסקת מסקנות, אוצר מילים, רעיון מרכזי, הוכחה.
 */
export const generatedQuestionSchema = z.object({
  type: z.enum(["explicit", "inference", "main_idea", "vocabulary", "evidence", "critical", "mcq"]),
  skill_key: z
    .string()
    .describe("מפתח המיומנות המתאימה מתוך: accuracy, fluency, vocabulary, comprehension, explicit_info, inference, main_idea, sequence, cause_effect, reasoning"),
  question_text: z.string(),
  options: z
    .array(z.object({ label: z.string() }))
    .max(4)
    .optional()
    .describe("רק לשאלות מסוג mcq - בין 2 ל-4 אפשרויות"),
  correct_option_index: z.number().int().min(0).optional().describe("רק לשאלות mcq - אינדקס האפשרות הנכונה (0-מבוסס)"),
  reference_answer: z.string().optional().describe("לשאלות פתוחות - קו מנחה קצר לתשובה טובה"),
});

export const generateTextWithQuestionsOutputSchema = z.object({
  title: z.string().describe("כותרת קצרה ומושכת לטקסט"),
  content: z.string().describe("גוף הטקסט המלא, בעברית תקנית ומתאימה לגיל היעד"),
  cover_icon: z.string().describe("אימוג'י אחד שמייצג את נושא הטקסט"),
  vocabulary_words: z
    .array(z.object({ word: z.string(), definition: z.string() }))
    .min(2)
    .max(4)
    .describe("2-4 מילים מהטקסט שכדאי להכיר, עם הגדרה קצרה מתאימה לגיל"),
  questions: z
    .array(generatedQuestionSchema)
    .min(5)
    .describe("לפחות 5 שאלות: לפחות אחת מכל סוג - מידע מפורש, הסקת מסקנות, אוצר מילים, רעיון מרכזי, הוכחה מהטקסט"),
});
export type GenerateTextWithQuestionsOutput = z.infer<typeof generateTextWithQuestionsOutputSchema>;

/** תוצאה בטוחה לשימוש כש-AI לא זמין (סעיף 26 במפרט - אין לקרוס, יש להמשיך לעבוד) */
export interface AiUnavailable {
  unavailable: true;
  message: string;
}
