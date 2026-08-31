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

/** תוצאה בטוחה לשימוש כש-AI לא זמין (סעיף 26 במפרט - אין לקרוס, יש להמשיך לעבוד) */
export interface AiUnavailable {
  unavailable: true;
  message: string;
}
