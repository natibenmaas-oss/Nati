"use server";

import { createClient } from "@/lib/supabase/server";
import { getClassWeeklyStats } from "@/lib/scoring/class-weekly-stats";
import { generateWeeklyReport } from "@/lib/ai/generateWeeklyReport";
import type { WeeklyReportOutput } from "@/lib/ai/schemas";

export interface WeeklyReportActionState {
  error?: string;
  data?: WeeklyReportOutput;
}

export async function generateWeeklyReportAction(classId: string): Promise<WeeklyReportActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "יש להתחבר מחדש" };

  // ודא שהכיתה שייכת למורה המחובר
  const { data: klass } = await supabase
    .from("classes")
    .select("id")
    .eq("id", classId)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!klass) return { error: "הכיתה לא נמצאה" };

  const stats = await getClassWeeklyStats(classId);
  if (!stats) return { error: "אין מספיק נתונים כדי לייצר סיכום" };

  const result = await generateWeeklyReport(stats);
  if ("unavailable" in result) return { error: result.message };

  return { data: result };
}
