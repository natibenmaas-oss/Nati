"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { analyzeStudent } from "@/lib/ai/analyzeStudent";

const RECOMMENDATION_TYPE = "personalization_recommendation";

export interface StoredRecommendation {
  text: string;
  focusSkillName: string | null;
  generatedAt: string;
}

async function loadStudentSkillsForAnalysis(studentId: string) {
  const supabase = await createClient();
  const [{ data: scores }, { data: skills }, { data: profile }] = await Promise.all([
    supabase
      .from("student_skill_scores")
      .select("skill_id, score, sample_size, trend")
      .eq("student_id", studentId),
    supabase.from("skills").select("id, key, name_he"),
    supabase.from("profiles").select("full_name").eq("id", studentId).single(),
  ]);

  const skillById = new Map((skills ?? []).map((s) => [s.id, s]));
  const skillsInput = (scores ?? [])
    .filter((s) => s.sample_size > 0)
    .map((s) => {
      const skill = skillById.get(s.skill_id);
      return {
        key: skill?.key ?? "comprehension",
        name: skill?.name_he ?? "מיומנות",
        score: s.score,
        sampleSize: s.sample_size,
        trend: s.trend,
      };
    });

  return {
    skillsInput,
    firstName: profile?.full_name?.split(" ")[0] ?? "התלמיד/ה",
    // המפתחות מוקלדים כ-string גנרי בכוונה: הם מושווים מול פלט חופשי של ה-AI
    // (focus_skill_key), שאינו מובטח להיות אחד מה-SkillKey הידועים בזמן קומפילציה
    skillIdByKey: new Map<string, string>((skills ?? []).map((s) => [s.key, s.id])),
    skillNameByKey: new Map<string, string>((skills ?? []).map((s) => [s.key, s.name_he])),
  };
}

/**
 * מחזיר את המלצת ה-AI האחרונה שנשמרה לתלמיד/ה, או null אם עדיין אין.
 * לא קורא ל-AI - קריאה מהירה בלבד (ai_feedback). ליצירה/רענון ראו regenerateRecommendationAction.
 */
export async function getStoredRecommendation(studentId: string): Promise<StoredRecommendation | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_feedback")
    .select("feedback_text, created_at, related_id")
    .eq("student_id", studentId)
    .eq("feedback_type", RECOMMENDATION_TYPE)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  let focusSkillName: string | null = null;
  if (data.related_id) {
    const { data: skill } = await supabase.from("skills").select("name_he").eq("id", data.related_id).maybeSingle();
    focusSkillName = skill?.name_he ?? null;
  }

  return { text: data.feedback_text, focusSkillName, generatedAt: data.created_at };
}

export interface RecommendationActionState {
  error?: string;
  data?: StoredRecommendation;
}

/**
 * מייצר (או מרענן) המלצת AI לתלמיד/ה (סעיף 9 - מנוע התאמה אישית; סעיף 6 - "המלצת AI").
 * המורה מאומת ע"י RLS: אם ה-select על students לא מחזיר שורה, המורה הזה לא מלמד את התלמיד/ה.
 */
export async function regenerateRecommendationAction(studentId: string): Promise<RecommendationActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "יש להתחבר מחדש" };

  const { data: student } = await supabase.from("students").select("id").eq("id", studentId).maybeSingle();
  if (!student) return { error: "אין הרשאה לתלמיד/ה זו" };

  const { skillsInput, firstName, skillIdByKey, skillNameByKey } = await loadStudentSkillsForAnalysis(studentId);

  const result = await analyzeStudent({
    studentFirstName: firstName,
    gradeLevel: "יסודי",
    skills: skillsInput,
  });

  if ("unavailable" in result) {
    return { error: result.message };
  }

  const combinedText = `${result.summary}\n\n${result.recommendation}`;
  const skillId = skillIdByKey.get(result.focus_skill_key) ?? null;

  // כתיבה ל-ai_feedback דורשת admin client - אין ל-client שום הרשאת כתיבה לפי RLS (0002_rls.sql)
  const admin = createAdminClient();
  await admin.from("ai_feedback").insert({
    student_id: studentId,
    related_type: "skill",
    related_id: skillId,
    feedback_text: combinedText,
    feedback_type: RECOMMENDATION_TYPE,
  });

  revalidatePath(`/teacher/students/${studentId}`);

  return {
    data: {
      text: combinedText,
      focusSkillName: skillNameByKey.get(result.focus_skill_key) ?? null,
      generatedAt: new Date().toISOString(),
    },
  };
}
