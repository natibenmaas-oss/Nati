import Link from "next/link";
import { Clock, Flame, Star, Target, BookOpen, Lightbulb } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getStudentDashboardData } from "@/lib/scoring/student-dashboard";
import { getStudentProfileData } from "@/lib/scoring/student-profile";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata = { title: "הבית שלי — ReadWise AI" };

export default async function StudentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ completed?: string }>;
}) {
  const { completed } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const firstName = profile?.full_name?.split(" ")[0] ?? "";
  const [{ pendingAssignments, currentStreak, totalPoints }, { weaknesses }] = await Promise.all([
    getStudentDashboardData(user!.id),
    getStudentProfileData(user!.id),
  ]);
  const nextAssignment = pendingAssignments[0];
  // המלצת מיקוד שבועית - לוגיקת כללים פשוטה (לא AI), מבוססת על המיומנות
  // עם הציון הכי נמוך מבין אלו שכבר יש עליהן מספיק נתונים (סעיף 9 במפרט)
  const focusSkill = weaknesses[0];

  return (
    <div className="flex flex-col gap-6">
      {completed === "1" && (
        <div className="rounded-lg bg-success/15 px-4 py-3 text-sm font-medium text-success" role="status">
          כל הכבוד! השלמת את משימת הקריאה 🎉
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold">שלום {firstName} 👋</h1>
        <p className="text-muted-foreground">
          {pendingAssignments.length === 0
            ? "אין לך משימות ממתינות כרגע — כל הכבוד!"
            : pendingAssignments.length === 1
              ? "היום מחכה לך משימת קריאה אחת"
              : `היום מחכות לך ${pendingAssignments.length} משימות קריאה`}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-full bg-warning/20 px-4 py-2 text-sm font-medium text-warning-foreground">
          <Flame className="size-4" aria-hidden />
          רצף {currentStreak} ימים
        </div>
        <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
          <Star className="size-4" aria-hidden />
          {totalPoints} נקודות
        </div>
        {focusSkill && (
          <div className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
            <Lightbulb className="size-4" aria-hidden />
            מומלץ להתמקד ב{focusSkill.skillName}
          </div>
        )}
      </div>

      {!nextAssignment ? (
        <EmptyState
          icon={BookOpen}
          title="אין כרגע משימת קריאה"
          description="כשהמורה יקצה לך משימה חדשה, היא תופיע כאן."
        />
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl" aria-hidden>
                {nextAssignment.coverIcon}
              </div>
              <div>
                <p className="text-lg font-bold">{nextAssignment.textTitle}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-4" aria-hidden />
                    זמן משוער: {nextAssignment.estimatedReadingTime} דקות
                  </span>
                  {nextAssignment.skillFocusNames.map((name) => (
                    <span key={name} className="flex items-center gap-1">
                      <Target className="size-4" aria-hidden />
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <Button asChild size="lg">
              <Link href={`/student/assignment/${nextAssignment.assignmentId}/prepare`}>התחל</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {pendingAssignments.length > 1 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">משימות נוספות</p>
          {pendingAssignments.slice(1).map((a) => (
            <Card key={a.assignmentId}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl" aria-hidden>
                    {a.coverIcon}
                  </span>
                  <span className="font-medium">{a.textTitle}</span>
                  {a.submissionStatus === "in_progress" && <Badge variant="secondary">בתהליך</Badge>}
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/student/assignment/${a.assignmentId}/prepare`}>המשך</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
