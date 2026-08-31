import type { WeeklyClassStats } from "@/lib/scoring/class-weekly-stats";

/**
 * Role: עוזר/ת הוראה שמסכם/ת נתוני שבוע לכיתה.
 * Context: סטטיסטיקות שבועיות שכבר חושבו בכללים (lib/scoring/class-weekly-stats).
 * Input: WeeklyClassStats.
 * Rules: להשתמש אך ורק במספרים שסופקו - לא להמציא אחוזים או שמות תלמידים.
 * Output schema: weeklyReportOutputSchema.
 * Safety constraints: טון מקצועי, בונה, לא מאשים אף תלמיד/ה או את המורה.
 */
export function buildWeeklyReportPrompt(stats: WeeklyClassStats) {
  const system = `את/ה עוזר/ת הוראה שכותב/ת סיכום שבועי קצר וברור למורה, על סמך נתונים מספריים שכבר חושבו במערכת.

חוקים מחייבים:
1. השתמש/י אך ורק במספרים שסופקו. אל תמציא/י אחוזים, שמות תלמידים, או פרטים שלא נמסרו.
2. אם comprehensionChange הוא null, אל תזכיר/י שינוי באחוזי הבנת הנקרא כלל.
3. headline - משפט אחד, טון מעודד גם אם התוצאות מעורבות (למשל "שבוע יציב עם כמה הישגים יפים").
4. highlights - 2 עד 4 משפטים עובדתיים קצרים, כל אחד מבוסס ישירות על אחד השדות שסופקו.
5. recommendation - המלצה מעשית אחת לשבוע הבא (למשל "מומלץ להקדיש שיעור קצר להסקת מסקנות"), לא רשימה.
6. טון מקצועי, חם ובונה. לעולם לא להאשים תלמידים ספציפיים או את המורה.

השב/י אך ורק בפורמט ה-JSON המבוקש.`;

  const user = `כיתה: ${stats.className}
מספר תלמידים: ${stats.studentCount}
שינוי בהבנת הנקרא (ממוצע כיתתי): ${
    stats.comprehensionChange
      ? `מ-${stats.comprehensionChange.from}% ל-${stats.comprehensionChange.to}% (שינוי: ${
          stats.comprehensionChange.delta > 0 ? "+" : ""
        }${stats.comprehensionChange.delta})`
      : "אין מספיק נתונים להשוואה"
  }
תלמידים שהשתפרו (בכל מיומנות שהיא): ${stats.studentsImprovedCount}
המיומנות החלשה ביותר בכיתה: ${stats.strugglingSkillName ?? "לא ידוע"}
מספר תלמידים המתקשים במיומנות זו: ${stats.strugglingStudentsCount}
משימות שהושלמו השבוע: ${stats.completedAssignmentsThisWeek}`;

  return { system, user };
}
