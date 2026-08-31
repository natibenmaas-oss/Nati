import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * שכבת ה-AI כולה רצה אך ורק בצד שרת. "server-only" יזרוק שגיאת build אם קובץ
 * זה (או כל קובץ שמייבא אותו) ינסה להיטען לתוך ה-bundle שנשלח ללקוח.
 *
 * מודל ברירת המחדל הוא claude-opus-5. ניתן לשנות דרך ANTHROPIC_MODEL בסביבת
 * השרת בלבד (למשל למעבר למודל זול/מהיר יותר) - זו החלטה שנשארת ביד המפעיל
 * של המערכת, לא משהו שנקבע אוטומטית לצורך חיסכון.
 */
export const AI_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

// משימות סיווג/ניקוד קצרות - effort בינוני מספיק, ולא צריך את ה-reasoning
// העמוק ביותר שנועד למשימות קידוד/סוכנים ארוכות טווח.
export const AI_EFFORT = "medium" as const;
export const AI_MAX_TOKENS = 1024;

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    client = new Anthropic(); // קורא ANTHROPIC_API_KEY מסביבת השרת אוטומטית
  }
  return client;
}

export function isAiConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
