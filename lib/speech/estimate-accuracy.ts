/**
 * מעריך "אחוז חפיפה" גס בין מה ש-Web Speech API זיהה לבין הטקסט המקורי.
 *
 * ⚠️ זהו לא ניתוח טעויות קריאה אמיתי (miscue analysis) - הוא לא יודע להבחין
 * בין "התלמיד/ה קרא/ה לא נכון" לבין "מנוע הזיהוי פספס/שיבש מילה". זהו קירוב
 * גס בלבד המבוסס על חפיפת מילים (multiset overlap), ולעולם יש להציג אותו
 * כ"משוער" ולא כמדד דיוק לשוני. ראו סעיף 11 במפרט.
 */
export function estimateRecognitionAccuracy(recognizedText: string, originalText: string): number | null {
  const recognizedWords = normalizeWords(recognizedText);
  const originalWords = normalizeWords(originalText);

  if (recognizedWords.length === 0 || originalWords.length === 0) return null;

  const originalCounts = new Map<string, number>();
  for (const word of originalWords) {
    originalCounts.set(word, (originalCounts.get(word) ?? 0) + 1);
  }

  let matched = 0;
  for (const word of recognizedWords) {
    const remaining = originalCounts.get(word) ?? 0;
    if (remaining > 0) {
      matched += 1;
      originalCounts.set(word, remaining - 1);
    }
  }

  const overlapRatio = (2 * matched) / (recognizedWords.length + originalWords.length);
  return Math.round(overlapRatio * 1000) / 10; // 0-100, ספרה עשרונית אחת
}

function normalizeWords(text: string): string[] {
  return text
    .replace(/[֑-ׇ]/g, "") // ניקוד עברי
    .replace(/[.,!?;:"'()׳״«»-]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}
