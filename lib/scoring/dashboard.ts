import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SkillKey } from "@/types/database";

// סף "זקוק לתרגול": ציון מיומנות מתחת לערך הזה (מתוך 100) נחשב לתחום חלש.
// זו לוגיקת כללים פשוטה, לא AI — מטרתה לתת למורה איתות ראשוני, לא קביעה סופית.
const NEEDS_PRACTICE_THRESHOLD = 65;
const ATTENTION_LIST_LIMIT = 5;

export interface StudentNeedingAttention {
  studentId: string;
  fullName: string;
  weakestSkillName: string;
  score: number;
}

export interface SkillAverage {
  skillKey: SkillKey;
  skillName: string;
  average: number;
  studentsCounted: number;
}

export interface TeacherDashboardData {
  studentCount: number;
  improvedCount: number;
  needsPracticeCount: number;
  activeAssignmentsCount: number;
  avgComprehension: number | null;
  avgFluency: number | null;
  studentsNeedingAttention: StudentNeedingAttention[];
  skillAverages: SkillAverage[];
}

const EMPTY: TeacherDashboardData = {
  studentCount: 0,
  improvedCount: 0,
  needsPracticeCount: 0,
  activeAssignmentsCount: 0,
  avgComprehension: null,
  avgFluency: null,
  studentsNeedingAttention: [],
  skillAverages: [],
};

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

/**
 * מרכז את כל הלוגיקה הלא-תלויה-ב-AI לחישוב נתוני דשבורד המורה: ספירות, ממוצעים,
 * ורשימת "תלמידים שזקוקים לתשומת לב" (הציון הכי נמוך שלהם מתוך המיומנויות שכבר נמדדו).
 * כל החישוב נעשה מול נתונים אמיתיים ב-DB — אין כאן שום קריאה ל-AI, ולכן זה תמיד עובד
 * גם אם שירות ה-AI אינו זמין.
 */
export async function getTeacherDashboardData(teacherId: string): Promise<TeacherDashboardData> {
  const supabase = await createClient();

  const { data: classes } = await supabase.from("classes").select("id").eq("teacher_id", teacherId);
  const classIds = (classes ?? []).map((c) => c.id);
  if (classIds.length === 0) return EMPTY;

  const { data: members } = await supabase
    .from("class_members")
    .select("student_id")
    .in("class_id", classIds);
  const studentIds = Array.from(new Set((members ?? []).map((m) => m.student_id)));
  if (studentIds.length === 0) return EMPTY;

  const [{ data: profiles }, { data: scores }, { data: skills }, { data: assignments }] =
    await Promise.all([
      supabase.from("profiles").select("id, full_name").in("id", studentIds),
      supabase
        .from("student_skill_scores")
        .select("student_id, skill_id, score, trend, sample_size")
        .in("student_id", studentIds),
      supabase.from("skills").select("id, key, name_he"),
      supabase.from("assignments").select("id, due_date").eq("teacher_id", teacherId),
    ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
  const skillById = new Map((skills ?? []).map((s) => [s.id, s]));
  const measuredScores = (scores ?? []).filter((s) => s.sample_size > 0);

  const improvedStudents = new Set(
    measuredScores.filter((s) => s.trend === "up").map((s) => s.student_id)
  );

  const weakestByStudent = new Map<string, { score: number; skillId: string }>();
  for (const row of measuredScores) {
    const current = weakestByStudent.get(row.student_id);
    if (!current || row.score < current.score) {
      weakestByStudent.set(row.student_id, { score: row.score, skillId: row.skill_id });
    }
  }

  const needsPracticeIds = new Set(
    [...weakestByStudent.entries()]
      .filter(([, v]) => v.score < NEEDS_PRACTICE_THRESHOLD)
      .map(([studentId]) => studentId)
  );

  const studentsNeedingAttention: StudentNeedingAttention[] = [...weakestByStudent.entries()]
    .filter(([, v]) => v.score < NEEDS_PRACTICE_THRESHOLD)
    .sort((a, b) => a[1].score - b[1].score)
    .slice(0, ATTENTION_LIST_LIMIT)
    .map(([studentId, v]) => ({
      studentId,
      fullName: profileById.get(studentId) ?? "תלמיד/ה",
      weakestSkillName: skillById.get(v.skillId)?.name_he ?? "מיומנות",
      score: v.score,
    }));

  const comprehensionSkillId = (skills ?? []).find((s) => s.key === "comprehension")?.id;
  const fluencySkillId = (skills ?? []).find((s) => s.key === "fluency")?.id;

  const today = new Date().toISOString().slice(0, 10);
  const activeAssignmentsCount = (assignments ?? []).filter(
    (a) => !a.due_date || a.due_date >= today
  ).length;

  const scoresBySkill = new Map<string, number[]>();
  for (const row of measuredScores) {
    const list = scoresBySkill.get(row.skill_id) ?? [];
    list.push(row.score);
    scoresBySkill.set(row.skill_id, list);
  }
  const skillAverages: SkillAverage[] = (skills ?? [])
    .map((skill) => {
      const values = scoresBySkill.get(skill.id) ?? [];
      const avg = average(values);
      return avg === null
        ? null
        : { skillKey: skill.key, skillName: skill.name_he, average: avg, studentsCounted: values.length };
    })
    .filter((s): s is SkillAverage => s !== null);

  return {
    studentCount: studentIds.length,
    improvedCount: improvedStudents.size,
    needsPracticeCount: needsPracticeIds.size,
    activeAssignmentsCount,
    avgComprehension: average(
      measuredScores.filter((s) => s.skill_id === comprehensionSkillId).map((s) => s.score)
    ),
    avgFluency: average(
      measuredScores.filter((s) => s.skill_id === fluencySkillId).map((s) => s.score)
    ),
    studentsNeedingAttention,
    skillAverages,
  };
}
