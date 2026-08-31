"use client";

import { useState, useTransition } from "react";
import { Sparkles, TrendingUp, Users, ClipboardCheck } from "lucide-react";
import { generateWeeklyReportAction } from "@/lib/actions/weekly-report";
import type { WeeklyClassStats } from "@/lib/scoring/class-weekly-stats";
import type { WeeklyReportOutput } from "@/lib/ai/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function WeeklyReportPanel({ classId, stats }: { classId: string; stats: WeeklyClassStats }) {
  const [report, setReport] = useState<WeeklyReportOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateWeeklyReportAction(classId);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.data) setReport(result.data);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{stats.className}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pb-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatMini
            icon={Users}
            label="השתפרו השבוע"
            value={stats.studentsImprovedCount}
          />
          <StatMini
            icon={ClipboardCheck}
            label="משימות הושלמו"
            value={stats.completedAssignmentsThisWeek}
          />
          <StatMini
            icon={TrendingUp}
            label="הבנת הנקרא"
            value={stats.comprehensionChange ? `${stats.comprehensionChange.delta > 0 ? "+" : ""}${stats.comprehensionChange.delta}%` : "—"}
          />
          <StatMini
            icon={Users}
            label={stats.strugglingSkillName ? `מתקשים ב${stats.strugglingSkillName}` : "מתקשים"}
            value={stats.strugglingStudentsCount}
          />
        </div>

        {report ? (
          <div className="flex flex-col gap-2 rounded-lg bg-primary/5 p-4">
            <p className="font-medium">{report.headline}</p>
            <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
              {report.highlights.map((h, i) => (
                <li key={i}>• {h}</li>
              ))}
            </ul>
            <Badge className="mt-1 w-fit">המלצה: {report.recommendation}</Badge>
          </div>
        ) : (
          error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )
        )}

        <Button variant="outline" size="sm" className="self-start" onClick={handleGenerate} disabled={isPending}>
          <Sparkles />
          {isPending ? "מנתח/ת נתונים..." : report ? "רענון סיכום AI" : "יצירת סיכום AI"}
        </Button>
      </CardContent>
    </Card>
  );
}

function StatMini({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-3 text-center">
      <Icon className="size-4 text-primary" aria-hidden />
      <span className="font-bold">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
