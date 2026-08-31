import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface TodaysAssignment {
  assignmentId: string;
  title: string;
  textTitle: string;
  coverIcon: string;
  estimatedReadingTime: number;
  skillFocusNames: string[];
  submissionStatus: "not_started" | "in_progress" | "completed";
}

export interface StudentDashboardData {
  pendingAssignments: TodaysAssignment[];
  currentStreak: number;
  totalPoints: number;
}

/**
 * שולף עבור תלמיד את משימות הקריאה הממתינות לו (עדיין לא הושלמו), ממוינות לפי תאריך יעד.
 * לא AI — שאילתות ישירות מול assignments/assignment_submissions.
 */
export async function getStudentDashboardData(studentId: string): Promise<StudentDashboardData> {
  const supabase = await createClient();

  const { data: studentRow } = await supabase
    .from("students")
    .select("current_streak, total_points")
    .eq("id", studentId)
    .maybeSingle();

  const { data: memberships } = await supabase
    .from("class_members")
    .select("class_id")
    .eq("student_id", studentId);
  const classIds = (memberships ?? []).map((m) => m.class_id);

  if (classIds.length === 0) {
    return {
      pendingAssignments: [],
      currentStreak: studentRow?.current_streak ?? 0,
      totalPoints: studentRow?.total_points ?? 0,
    };
  }

  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, title, text_id, skill_focus, due_date")
    .in("class_id", classIds)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (!assignments || assignments.length === 0) {
    return {
      pendingAssignments: [],
      currentStreak: studentRow?.current_streak ?? 0,
      totalPoints: studentRow?.total_points ?? 0,
    };
  }

  const assignmentIds = assignments.map((a) => a.id);
  const textIds = Array.from(new Set(assignments.map((a) => a.text_id)));
  const skillIds = Array.from(new Set(assignments.flatMap((a) => a.skill_focus)));

  const [{ data: submissions }, { data: texts }, { data: skills }] = await Promise.all([
    supabase
      .from("assignment_submissions")
      .select("assignment_id, status")
      .eq("student_id", studentId)
      .in("assignment_id", assignmentIds),
    supabase.from("texts").select("id, title, cover_icon, estimated_reading_time").in("id", textIds),
    skillIds.length
      ? supabase.from("skills").select("id, name_he").in("id", skillIds)
      : Promise.resolve({ data: [] as { id: string; name_he: string }[] }),
  ]);

  const submissionByAssignment = new Map((submissions ?? []).map((s) => [s.assignment_id, s.status]));
  const textById = new Map((texts ?? []).map((t) => [t.id, t]));
  const skillNameById = new Map((skills ?? []).map((s) => [s.id, s.name_he]));

  const pendingAssignments: TodaysAssignment[] = assignments
    .map((a) => {
      const status = submissionByAssignment.get(a.id) ?? "not_started";
      const text = textById.get(a.text_id);
      return {
        assignmentId: a.id,
        title: a.title,
        textTitle: text?.title ?? "טקסט",
        coverIcon: text?.cover_icon ?? "📖",
        estimatedReadingTime: text?.estimated_reading_time ?? 5,
        skillFocusNames: a.skill_focus.map((id) => skillNameById.get(id)).filter((n): n is string => !!n),
        submissionStatus: status as TodaysAssignment["submissionStatus"],
      };
    })
    .filter((a) => a.submissionStatus !== "completed");

  return {
    pendingAssignments,
    currentStreak: studentRow?.current_streak ?? 0,
    totalPoints: studentRow?.total_points ?? 0,
  };
}
