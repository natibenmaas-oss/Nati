import { FileBarChart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getClassWeeklyStats } from "@/lib/scoring/class-weekly-stats";
import { EmptyState } from "@/components/shared/empty-state";
import { WeeklyReportPanel } from "@/components/teacher/weekly-report-panel";

export const metadata = { title: "דוחות — ReadWise AI" };

export default async function TeacherReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: classes } = await supabase.from("classes").select("id, name").eq("teacher_id", user!.id);

  const statsList = await Promise.all(
    (classes ?? []).map(async (c) => ({ classId: c.id, stats: await getClassWeeklyStats(c.id) }))
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">דוחות</h1>
        <p className="text-muted-foreground">סיכום שבועי לכל כיתה, עם ניתוח AI</p>
      </div>

      {statsList.length === 0 ? (
        <EmptyState
          icon={FileBarChart}
          title="אין עדיין כיתות"
          description="צרו כיתה כדי לראות כאן דוחות."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {statsList.map(({ classId, stats }) =>
            stats ? <WeeklyReportPanel key={classId} classId={classId} stats={stats} /> : null
          )}
        </div>
      )}
    </div>
  );
}
