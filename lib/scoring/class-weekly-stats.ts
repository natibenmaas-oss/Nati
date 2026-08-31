import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getClassWeakestSkill } from "@/lib/scoring/class-recommendation";

const NEEDS_PRACTICE_THRESHOLD = 65;

export interface WeeklyClassStats {
  className: string;
  studentCount: number;
  comprehensionChange: { from: number; to: number; delta: number } | null;
  studentsImprovedCount: number;
  strugglingSkillName: string | null;
  strugglingStudentsCount: number;
  completedAssignmentsThisWeek: number;
}

/**
 * מחשב את נתוני "הסיכום השבועי" לכיתה (סעיף 20 במפרט) - כולם בלוגיקת כללים,
 * לא AI. lib/ai/generateWeeklyReport משתמש בפלט הזה כדי לנסח את הסיכום בעברית.
 */
export async function getClassWeeklyStats(classId: string): Promise<WeeklyClassStats | null> {
  const supabase = await createClient();

  const { data: klass } = await supabase.from("classes").select("name").eq("id", classId).maybeSingle();
  if (!klass) return null;

  const { data: members } = await supabase.from("class_members").select("student_id").eq("class_id", classId);
  const studentIds = (members ?? []).map((m) => m.student_id);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoIso = weekAgo.toISOString();

  if (studentIds.length === 0) {
    return {
      className: klass.name,
      studentCount: 0,
      comprehensionChange: null,
      studentsImprovedCount: 0,
      strugglingSkillName: null,
      strugglingStudentsCount: 0,
      completedAssignmentsThisWeek: 0,
    };
  }

  const { data: comprehensionSkill } = await supabase.from("skills").select("id").eq("key", "comprehension").single();

  const [{ data: currentScores }, { data: historyRows }, weakest, { data: assignments }] = await Promise.all([
    supabase
      .from("student_skill_scores")
      .select("student_id, skill_id, score, trend")
      .in("student_id", studentIds),
    comprehensionSkill
      ? supabase
          .from("student_skill_score_history")
          .select("student_id, score, recorded_at")
          .eq("skill_id", comprehensionSkill.id)
          .in("student_id", studentIds)
          .lte("recorded_at", weekAgoIso)
          .order("recorded_at", { ascending: false })
      : Promise.resolve({ data: [] as { student_id: string; score: number; recorded_at: string }[] }),
    getClassWeakestSkill(classId),
    supabase.from("assignments").select("id").eq("class_id", classId),
  ]);

  // ממוצע הבנת הנקרא היום מול לפני שבוע (רק תלמידים שיש להם נתון בשתי הנקודות)
  const currentComprehensionByStudent = new Map(
    (currentScores ?? []).filter((s) => s.skill_id === comprehensionSkill?.id).map((s) => [s.student_id, s.score])
  );
  const priorComprehensionByStudent = new Map<string, number>();
  for (const row of historyRows ?? []) {
    if (!priorComprehensionByStudent.has(row.student_id)) {
      priorComprehensionByStudent.set(row.student_id, row.score); // הראשון (המאוחר ביותר לפני שבוע) בזכות ה-order
    }
  }
  const pairs = [...currentComprehensionByStudent.entries()]
    .filter(([studentId]) => priorComprehensionByStudent.has(studentId))
    .map(([studentId, current]) => ({ current, prior: priorComprehensionByStudent.get(studentId)! }));

  const comprehensionChange =
    pairs.length > 0
      ? {
          from: Math.round((pairs.reduce((a, p) => a + p.prior, 0) / pairs.length) * 10) / 10,
          to: Math.round((pairs.reduce((a, p) => a + p.current, 0) / pairs.length) * 10) / 10,
          delta: 0,
        }
      : null;
  if (comprehensionChange) comprehensionChange.delta = Math.round((comprehensionChange.to - comprehensionChange.from) * 10) / 10;

  const studentsImprovedCount = new Set(
    (currentScores ?? []).filter((s) => s.trend === "up").map((s) => s.student_id)
  ).size;

  const strugglingStudentsCount = weakest
    ? new Set(
        (currentScores ?? [])
          .filter((s) => s.skill_id === weakest.skillId && s.score < NEEDS_PRACTICE_THRESHOLD)
          .map((s) => s.student_id)
      ).size
    : 0;

  const assignmentIds = (assignments ?? []).map((a) => a.id);
  let completedAssignmentsThisWeek = 0;
  if (assignmentIds.length > 0) {
    const { count } = await supabase
      .from("assignment_submissions")
      .select("id", { count: "exact", head: true })
      .in("assignment_id", assignmentIds)
      .eq("status", "completed")
      .gte("submitted_at", weekAgoIso);
    completedAssignmentsThisWeek = count ?? 0;
  }

  return {
    className: klass.name,
    studentCount: studentIds.length,
    comprehensionChange,
    studentsImprovedCount,
    strugglingSkillName: weakest?.skillName ?? null,
    strugglingStudentsCount,
    completedAssignmentsThisWeek,
  };
}
