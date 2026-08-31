import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SkillKey } from "@/types/database";

const BASE_COMPLETION_POINTS = 10;
const PERFECT_SCORE_BONUS = 5;

export interface EarnedAchievement {
  key: string;
  title: string;
  description: string;
  icon: string;
}

export interface CompletionRewards {
  pointsAwarded: number;
  totalPoints: number;
  currentStreak: number;
  newAchievements: EarnedAchievement[];
}

/**
 * מעניק נקודות, מעדכן streak, מסמן מילות אוצר מילים כ"נלמדו", ובודק הישגים
 * חדשים - הכל מופעל בסיום משימת קריאה (submitReflection). סעיף 15 במפרט:
 * הניקוד מבוסס על *השלמה*, לא על ציון - כדי לא להפוך את זה לתחרות שמשפילה
 * תלמידים חלשים יותר.
 */
export async function awardCompletionRewards(studentId: string, sessionId: string): Promise<CompletionRewards> {
  const admin = createAdminClient();

  const { data: session } = await admin
    .from("reading_sessions")
    .select("text_id, reading_mode, assignment_id")
    .eq("id", sessionId)
    .single();

  const { data: submission } = session?.assignment_id
    ? await admin
        .from("assignment_submissions")
        .select("score")
        .eq("assignment_id", session.assignment_id)
        .eq("student_id", studentId)
        .maybeSingle()
    : { data: null };

  const isPerfect = submission?.score === 100;
  const pointsAwarded = BASE_COMPLETION_POINTS + (isPerfect ? PERFECT_SCORE_BONUS : 0);

  const { data: student } = await admin
    .from("students")
    .select("total_points, current_streak, longest_streak, last_activity_at")
    .eq("id", studentId)
    .single();

  const today = new Date().toISOString().slice(0, 10);
  const lastActivityDay = student?.last_activity_at?.slice(0, 10) ?? null;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let newStreak = student?.current_streak ?? 0;
  if (lastActivityDay === today) {
    // כבר תרגל/ה היום - הרצף לא משתנה
  } else if (lastActivityDay === yesterdayStr) {
    newStreak += 1;
  } else {
    newStreak = 1;
  }

  const newTotalPoints = (student?.total_points ?? 0) + pointsAwarded;
  const newLongestStreak = Math.max(student?.longest_streak ?? 0, newStreak);

  await admin
    .from("students")
    .update({
      total_points: newTotalPoints,
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", studentId);

  if (session?.text_id) {
    await markVocabularyAsLearned(admin, studentId, session.text_id);
  }

  const newAchievements = await checkAndAwardAchievements(admin, studentId, newStreak, newLongestStreak);

  return { pointsAwarded, totalPoints: newTotalPoints, currentStreak: newStreak, newAchievements };
}

type AdminClient = ReturnType<typeof createAdminClient>;

async function markVocabularyAsLearned(admin: AdminClient, studentId: string, textId: string) {
  const { data: words } = await admin.from("vocabulary_words").select("id").eq("text_id", textId);
  if (!words || words.length === 0) return;

  await admin.from("student_vocabulary").upsert(
    words.map((w) => ({ student_id: studentId, word_id: w.id, mastery_level: 70, review_count: 1 })),
    { onConflict: "student_id,word_id", ignoreDuplicates: true }
  );
}

interface AchievementCriteria {
  type: string;
  days?: number;
  count?: number;
  skill?: string;
}

async function checkAndAwardAchievements(
  admin: AdminClient,
  studentId: string,
  currentStreak: number,
  longestStreak: number
): Promise<EarnedAchievement[]> {
  const [{ data: achievements }, { data: alreadyEarned }] = await Promise.all([
    admin.from("achievements").select("id, key, title, description, icon, criteria"),
    admin.from("student_achievements").select("achievement_id").eq("student_id", studentId),
  ]);

  const earnedIds = new Set((alreadyEarned ?? []).map((a) => a.achievement_id));
  const candidates = (achievements ?? []).filter((a) => !earnedIds.has(a.id));
  if (candidates.length === 0) return [];

  const newlyEarned: EarnedAchievement[] = [];

  for (const achievement of candidates) {
    const criteria = achievement.criteria as unknown as AchievementCriteria;
    const met = await meetsAchievementCriteria(admin, studentId, criteria, longestStreak);
    if (met) {
      await admin.from("student_achievements").insert({ student_id: studentId, achievement_id: achievement.id });
      newlyEarned.push({
        key: achievement.key,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
      });
    }
  }

  return newlyEarned;
}

async function meetsAchievementCriteria(
  admin: AdminClient,
  studentId: string,
  criteria: AchievementCriteria,
  longestStreak: number
): Promise<boolean> {
  switch (criteria.type) {
    case "streak":
      return longestStreak >= (criteria.days ?? 7);

    case "assignments_completed": {
      const { count } = await admin
        .from("assignment_submissions")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId)
        .eq("status", "completed");
      return (count ?? 0) >= (criteria.count ?? 1);
    }

    case "aloud_sessions": {
      const { count } = await admin
        .from("reading_sessions")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId)
        .eq("reading_mode", "aloud")
        .eq("status", "completed");
      return (count ?? 0) >= (criteria.count ?? 5);
    }

    case "vocabulary_learned": {
      const { count } = await admin
        .from("student_vocabulary")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId);
      return (count ?? 0) >= (criteria.count ?? 25);
    }

    case "perfect_assignment": {
      const { count } = await admin
        .from("assignment_submissions")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId)
        .eq("score", 100);
      return (count ?? 0) >= (criteria.count ?? 1);
    }

    case "skill_questions_correct": {
      if (!criteria.skill) return false;
      // criteria.skill מגיע מ-jsonb (achievements.criteria) ולכן מוקלד כ-string גנרי;
      // אנחנו שולטים בתוכן (seed data), ולכן זו הטלה בטוחה ל-SkillKey
      const { data: skill } = await admin
        .from("skills")
        .select("id")
        .eq("key", criteria.skill as SkillKey)
        .maybeSingle();
      if (!skill) return false;

      const { data: sessions } = await admin.from("reading_sessions").select("id").eq("student_id", studentId);
      const sessionIds = (sessions ?? []).map((s) => s.id);
      if (sessionIds.length === 0) return false;

      const { data: questions } = await admin.from("questions").select("id").eq("skill_id", skill.id);
      const questionIds = (questions ?? []).map((q) => q.id);
      if (questionIds.length === 0) return false;

      const { count } = await admin
        .from("answers")
        .select("id", { count: "exact", head: true })
        .in("session_id", sessionIds)
        .in("question_id", questionIds)
        .eq("is_correct", true);
      return (count ?? 0) >= (criteria.count ?? 10);
    }

    default:
      return false;
  }
}
