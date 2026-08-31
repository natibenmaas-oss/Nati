import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface ClassSkillRecommendation {
  skillId: string;
  skillKey: string;
  skillName: string;
  averageScore: number;
}

/**
 * מזהה את המיומנות החלשה ביותר בכיתה (ממוצע נמוך, עם מספיק דגימות) - שימוש
 * להצעת skill_focus אוטומטית בעת יצירת משימה (סעיף 9 במפרט - מנוע התאמה אישית,
 * ברמת כיתה במקום תלמיד בודד, כדי להתאים לזרימת "המורה יוצר/ת משימה לכיתה").
 * לוגיקת כללים פשוטה - לא AI.
 */
export async function getClassWeakestSkill(classId: string): Promise<ClassSkillRecommendation | null> {
  const supabase = await createClient();

  const { data: members } = await supabase.from("class_members").select("student_id").eq("class_id", classId);
  const studentIds = (members ?? []).map((m) => m.student_id);
  if (studentIds.length === 0) return null;

  const [{ data: scores }, { data: skills }] = await Promise.all([
    supabase
      .from("student_skill_scores")
      .select("skill_id, score, sample_size")
      .in("student_id", studentIds),
    supabase.from("skills").select("id, key, name_he"),
  ]);

  const measured = (scores ?? []).filter((s) => s.sample_size > 0);
  if (measured.length === 0) return null;

  const bySkill = new Map<string, number[]>();
  for (const row of measured) {
    const list = bySkill.get(row.skill_id) ?? [];
    list.push(row.score);
    bySkill.set(row.skill_id, list);
  }

  let weakest: ClassSkillRecommendation | null = null;
  for (const [skillId, values] of bySkill) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    if (!weakest || avg < weakest.averageScore) {
      const skill = (skills ?? []).find((s) => s.id === skillId);
      weakest = {
        skillId,
        skillKey: skill?.key ?? "comprehension",
        skillName: skill?.name_he ?? "מיומנות",
        averageScore: Math.round(avg * 10) / 10,
      };
    }
  }

  return weakest;
}
