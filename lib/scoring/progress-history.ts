import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SkillKey } from "@/types/database";

export interface SkillHistoryPoint {
  date: string; // yyyy-mm-dd
  score: number;
}

export interface SkillProgressSeries {
  skillKey: SkillKey;
  skillName: string;
  points: SkillHistoryPoint[];
  currentScore: number;
  changeFromFirst: number | null;
}

export interface StudentProgressData {
  bySkill: SkillProgressSeries[];
  overall: SkillHistoryPoint[];
  overallChange: { from: number; to: number; delta: number } | null;
}

/**
 * שולף את היסטוריית ציוני המיומנות של תלמיד/ה ומארגן אותה לגרפים: סדרה
 * לכל מיומנות + מגמה כוללת (ממוצע כל המיומנויות, מקובץ לפי יום) - כמו הדוגמה
 * בסעיף 17 במפרט ("לפני חודש: 62%, היום: 78%").
 */
export async function getStudentProgressHistory(studentId: string): Promise<StudentProgressData> {
  const supabase = await createClient();

  const [{ data: history }, { data: skills }] = await Promise.all([
    supabase
      .from("student_skill_score_history")
      .select("skill_id, score, recorded_at")
      .eq("student_id", studentId)
      .order("recorded_at", { ascending: true }),
    supabase.from("skills").select("id, key, name_he"),
  ]);

  const skillById = new Map((skills ?? []).map((s) => [s.id, s]));

  const bySkillId = new Map<string, SkillHistoryPoint[]>();
  const byDayAll = new Map<string, number[]>();

  for (const row of history ?? []) {
    const date = row.recorded_at.slice(0, 10);
    const list = bySkillId.get(row.skill_id) ?? [];
    list.push({ date, score: row.score });
    bySkillId.set(row.skill_id, list);

    const dayList = byDayAll.get(date) ?? [];
    dayList.push(row.score);
    byDayAll.set(date, dayList);
  }

  const bySkill: SkillProgressSeries[] = [...bySkillId.entries()].map(([skillId, points]) => {
    const skill = skillById.get(skillId);
    const first = points[0]?.score ?? null;
    const last = points[points.length - 1]?.score ?? 0;
    return {
      skillKey: (skill?.key ?? "comprehension") as SkillKey,
      skillName: skill?.name_he ?? "מיומנות",
      points,
      currentScore: last,
      changeFromFirst: points.length >= 2 && first !== null ? Math.round((last - first) * 10) / 10 : null,
    };
  });

  const overall: SkillHistoryPoint[] = [...byDayAll.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, scores]) => ({
      date,
      score: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
    }));

  const overallChange =
    overall.length >= 2
      ? {
          from: overall[0].score,
          to: overall[overall.length - 1].score,
          delta: Math.round((overall[overall.length - 1].score - overall[0].score) * 10) / 10,
        }
      : null;

  return { bySkill, overall, overallChange };
}
