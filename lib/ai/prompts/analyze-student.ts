export interface AnalyzeStudentInput {
  studentFirstName: string;
  gradeLevel: string;
  skills: { key: string; name: string; score: number; sampleSize: number; trend: string }[];
}

/**
 * Role: יועץ/ת פדגוגי/ת המנתח/ת נתוני קריאה עבור מורה.
 * Context: ציוני המיומנויות המחושבים (student_skill_scores) של תלמיד/ה מסוים/ת.
 * Input: שם פרטי, שכבת גיל, וטבלת ציוני מיומנויות (0-100, כולל כמות דגימות ומגמה).
 * Rules: להתבסס אך ורק על הנתונים המספריים שסופקו - לא להמציא פרטים על התלמיד/ה
 *        שלא נגזרים מהם. המלצה מעשית אחת, לא רשימה ארוכה. טון מקצועי אך חם.
 * Output schema: analyzeStudentOutputSchema.
 * Safety constraints: אין לתייג את התלמיד/ה בתוויות שליליות ("חלש/ה", "כושל/ת") -
 *        להתמקד בצמיחה ובצעד הבא, לא בכשל.
 */
export function buildAnalyzeStudentPrompt(input: AnalyzeStudentInput) {
  const skillsTable = input.skills
    .map(
      (s) =>
        `- ${s.name} (${s.key}): ציון ${s.score}/100, מבוסס על ${s.sampleSize} מדידות, מגמה: ${
          s.trend === "up" ? "משתפר/ת" : s.trend === "down" ? "יורד/ת" : "יציב/ה"
        }`
    )
    .join("\n");

  const system = `את/ה יועצ/ת פדגוגי/ת שעוזר/ת למורה לנתח את נתוני הקריאה של תלמיד/ה בבית ספר יסודי (שכבת גיל ${input.gradeLevel}) ולתת המלצת תרגול קונקרטית.

חוקים מחייבים:
1. התבסס/י אך ורק על ציוני המיומנויות שסופקו. אל תמציא/י פרטים אחרים על התלמיד/ה.
2. אם למיומנות מסוימת יש sample_size נמוך (0-2), ציין/י זאת כאי-ודאות ואל תסיק/י מסקנות חזקות ממנה.
3. focus_skill_key חייב להיות אחד מהמפתחות שסופקו בטבלה, ועדיף שיהיה המיומנות עם הציון הנמוך ביותר מבין אלו עם מספיק דגימות (3+).
4. אם כל הציונים גבוהים (75+), focus_skill_key יכול להיות מיומנות להעמקה/העלאת קושי, ו-recommendation יתמקד באתגור, לא בתיקון.
5. summary ו-recommendation קצרים - 2-3 משפטים כל אחד, בעברית פשוטה, בטון מקצועי וחם. לעולם לא לתייג את התלמיד/ה כ"חלש/ה" או "כושל/ת" - להתמקד בצעד הבא לצמיחה.
6. recommendation חייב להיות קונקרטי ומעשי (למשל: "מומלץ לבצע 3 תרגולי הסקת מסקנות קצרים השבוע"), לא כללי.

השב/י אך ורק בפורמט ה-JSON המבוקש.`;

  const user = `שם התלמיד/ה: ${input.studentFirstName}
שכבת גיל: ${input.gradeLevel}

ציוני מיומנויות:
${skillsTable || "(אין עדיין נתונים)"}`;

  return { system, user };
}
