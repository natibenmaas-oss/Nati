import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SkillTrend } from "@/types/database";

const TREND_CHANGE_THRESHOLD = 3;

/**
 * מחשב מחדש את student_skill_scores של תלמיד, מכל התשובות שכבר נבדקו
 * (MCQ שנבדק אוטומטית בכללים, או תשובות פתוחות שכבר קיבלו ai_score מ-AI Evaluator).
 * זו הפונקציה המרכזית של "מדוד שוב" בלולאה הפדגוגית (סעיף 29 במפרט).
 *
 * רץ תמיד עם ה-admin client: לפי RLS (0002_rls.sql) אין ל-client שום הרשאת כתיבה
 * ל-student_skill_scores — זהו בכוונה נתון מחושב, לא קלט ישיר של תלמיד/מורה.
 */
export async function recomputeStudentSkillScores(studentId: string): Promise<void> {
  const admin = createAdminClient();

  // answers אינה מכילה student_id ישירות - שולפים קודם את מפגשי הקריאה של התלמיד
  const { data: sessions } = await admin
    .from("reading_sessions")
    .select("id")
    .eq("student_id", studentId);
  const sessionIds = (sessions ?? []).map((s) => s.id);
  if (sessionIds.length === 0) return;

  const { data: studentAnswers } = await admin
    .from("answers")
    .select("is_correct, ai_score, question_id, session_id")
    .in("session_id", sessionIds)
    .not("student_answer", "is", null);

  if (!studentAnswers || studentAnswers.length === 0) return;

  const questionIds = Array.from(new Set(studentAnswers.map((a) => a.question_id)));
  const { data: questions } = await admin
    .from("questions")
    .select("id, skill_id")
    .in("id", questionIds);
  const skillByQuestion = new Map((questions ?? []).map((q) => [q.id, q.skill_id]));

  const scoresBySkill = new Map<string, number[]>();
  for (const a of studentAnswers) {
    const skillId = skillByQuestion.get(a.question_id);
    if (!skillId) continue;
    // ai_score (0-100) עדיף כשקיים; אחרת נגזר מ-is_correct כ-100/0
    const score = a.ai_score ?? (a.is_correct === true ? 100 : a.is_correct === false ? 0 : null);
    if (score === null) continue;
    const list = scoresBySkill.get(skillId) ?? [];
    list.push(score);
    scoresBySkill.set(skillId, list);
  }

  if (scoresBySkill.size === 0) return;

  const { data: existingScores } = await admin
    .from("student_skill_scores")
    .select("skill_id, score")
    .eq("student_id", studentId);
  const previousScoreBySkill = new Map((existingScores ?? []).map((s) => [s.skill_id, s.score]));

  for (const [skillId, scores] of scoresBySkill) {
    const average = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
    const previous = previousScoreBySkill.get(skillId);
    const trend: SkillTrend =
      previous === undefined
        ? "stable"
        : average - previous > TREND_CHANGE_THRESHOLD
          ? "up"
          : previous - average > TREND_CHANGE_THRESHOLD
            ? "down"
            : "stable";

    await admin.from("student_skill_scores").upsert(
      {
        student_id: studentId,
        skill_id: skillId,
        score: average,
        sample_size: scores.length,
        trend,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "student_id,skill_id" }
    );

    // תמונת מצב להיסטוריה - זה מה שמאפשר גרף "התקדמות לאורך זמן" (סעיפים 17, 20)
    await admin.from("student_skill_score_history").insert({
      student_id: studentId,
      skill_id: skillId,
      score: average,
    });
  }
}
