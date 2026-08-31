import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SkillKey } from "@/types/database";

const STRENGTH_THRESHOLD = 75;
const WEAKNESS_THRESHOLD = 65;

export interface StudentSkillRow {
  skillKey: SkillKey;
  skillName: string;
  score: number;
  sampleSize: number;
  trend: "up" | "down" | "stable";
}

export interface StudentProfileData {
  skills: StudentSkillRow[];
  strengths: StudentSkillRow[];
  weaknesses: StudentSkillRow[];
}

/**
 * שולף את פרופיל המיומנויות המחושב של תלמיד (ללא AI — ישירות מ-student_skill_scores).
 * ה-RLS כבר מבטיח שרק התלמיד עצמו או המורה שלו יכולים לקרוא את השורות האלה.
 */
export async function getStudentProfileData(studentId: string): Promise<StudentProfileData> {
  const supabase = await createClient();

  const [{ data: scores }, { data: skills }] = await Promise.all([
    supabase
      .from("student_skill_scores")
      .select("skill_id, score, sample_size, trend")
      .eq("student_id", studentId),
    supabase.from("skills").select("id, key, name_he"),
  ]);

  const skillById = new Map((skills ?? []).map((s) => [s.id, s]));

  const rows: StudentSkillRow[] = (scores ?? [])
    .filter((s) => s.sample_size > 0)
    .map((s) => {
      const skill = skillById.get(s.skill_id);
      return {
        skillKey: (skill?.key ?? "comprehension") as SkillKey,
        skillName: skill?.name_he ?? "מיומנות",
        score: s.score,
        sampleSize: s.sample_size,
        trend: s.trend,
      };
    })
    .sort((a, b) => b.score - a.score);

  return {
    skills: rows,
    strengths: rows.filter((r) => r.score >= STRENGTH_THRESHOLD),
    weaknesses: rows.filter((r) => r.score < WEAKNESS_THRESHOLD).sort((a, b) => a.score - b.score),
  };
}
