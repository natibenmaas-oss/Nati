import Link from "next/link";
import { Users, TrendingUp, AlertTriangle, ClipboardList, BookOpenCheck, Gauge, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTeacherDashboardData } from "@/lib/scoring/dashboard";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClassSkillChart } from "@/components/teacher/class-skill-chart";

export const metadata = { title: "דשבורד מורה — ReadWise AI" };

export default async function TeacherDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const data = await getTeacherDashboardData(user!.id);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">שלום, {profile?.full_name} 👋</h1>
        <p className="text-muted-foreground">זה מצב הקריאה של הכיתה שלך</p>
      </div>

      {data.studentCount === 0 ? (
        <EmptyState
          icon={Users}
          title="עדיין אין לך תלמידים במערכת"
          description="צרו כיתה והוסיפו אליה תלמידים כדי להתחיל לראות כאן נתוני קריאה והתקדמות."
          action={
            <Button asChild>
              <Link href="/teacher/classes">ניהול כיתות</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard icon={Users} label="תלמידים" value={data.studentCount} />
            <StatCard
              icon={TrendingUp}
              label="תלמידים שהשתפרו"
              value={data.improvedCount}
              tone="success"
            />
            <StatCard
              icon={AlertTriangle}
              label="זקוקים לתרגול"
              value={data.needsPracticeCount}
              tone="warning"
            />
            <StatCard icon={ClipboardList} label="משימות פעילות" value={data.activeAssignmentsCount} />
            <StatCard
              icon={BookOpenCheck}
              label="ממוצע הבנת הנקרא"
              value={data.avgComprehension !== null ? `${data.avgComprehension}%` : "אין נתונים עדיין"}
            />
            <StatCard
              icon={Gauge}
              label="ממוצע שטף קריאה"
              value={data.avgFluency !== null ? `${data.avgFluency}%` : "אין נתונים עדיין"}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-5 text-primary" aria-hidden />
                מצב הכיתה — ממוצע לפי מיומנות
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              {data.skillAverages.length === 0 ? (
                <EmptyState
                  icon={BarChart3}
                  title="עדיין אין נתוני קריאה"
                  description="הגרף יתמלא לאחר שהתלמידים יתחילו לבצע משימות קריאה."
                />
              ) : (
                <ClassSkillChart data={data.skillAverages} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-warning-foreground" aria-hidden />
                תלמידים שזקוקים לתשומת לב
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              {data.studentsNeedingAttention.length === 0 ? (
                <EmptyState
                  icon={AlertTriangle}
                  title="אין כרגע תלמידים שזוהו כזקוקים לתשומת לב מיוחדת"
                  description="הרשימה תתעדכן אוטומטית ככל שיצטברו נתוני קריאה."
                />
              ) : (
                <ul className="flex flex-col divide-y">
                  {data.studentsNeedingAttention.map((s) => (
                    <li key={s.studentId} className="flex items-center justify-between gap-4 py-3">
                      <div>
                        <p className="font-medium">{s.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          מתקשה ב{s.weakestSkillName} ({s.score}%)
                        </p>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/teacher/students/${s.studentId}`}>צפה בפרופיל</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
