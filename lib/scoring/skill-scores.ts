import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { recomputeStudentSkillScoresWithClient } from "@/lib/scoring/skill-scores-core";

/**
 * מחשב מחדש את student_skill_scores של תלמיד, מכל התשובות שכבר נבדקו
 * (MCQ שנבדק אוטומטית בכללים, או תשובות פתוחות שכבר קיבלו ai_score מ-AI Evaluator).
 * זו הפונקציה המרכזית של "מדוד שוב" בלולאה הפדגוגית (סעיף 29 במפרט).
 *
 * רץ תמיד עם ה-admin client: לפי RLS (0002_rls.sql) אין ל-client שום הרשאת כתיבה
 * ל-student_skill_scores — זהו בכוונה נתון מחושב, לא קלט ישיר של תלמיד/מורה.
 *
 * זהו רק עטיפה דקה סביב הליבה הטהורה ב-skill-scores-core.ts (המוגנת ב-"server-only"
 * כאן כדי שלא תיוצא בטעות מרכיב client) — ליצירת קליינט ה-admin.
 */
export async function recomputeStudentSkillScores(studentId: string): Promise<void> {
  const admin = createAdminClient();
  await recomputeStudentSkillScoresWithClient(admin, studentId);
}
