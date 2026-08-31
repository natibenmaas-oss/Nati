import { TrendingUp, LineChart as LineChartIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getStudentProgressHistory } from "@/lib/scoring/progress-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkillBar } from "@/components/shared/skill-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { ProgressChart } from "@/components/student/progress-chart";

export const metadata = { title: "ההתקדמות שלי — ReadWise AI" };

export default async function StudentProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { bySkill, overall, overallChange } = await getStudentProgressHistory(user!.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">ההתקדמות שלי</h1>
        <p className="text-muted-foreground">איך המדדים שלך משתנים עם הזמן</p>
      </div>

      {overall.length === 0 ? (
        <EmptyState
          icon={LineChartIcon}
          title="עדיין אין מספיק נתונים"
          description="ההתקדמות שלך תופיע כאן אחרי שתשלים/י כמה משימות קריאה."
        />
      ) : (
        <>
          {overallChange && (
            <Card className="border-success/40 bg-success/10">
              <CardContent className="flex items-center gap-3 pt-6 pb-6">
                <TrendingUp className="size-6 text-success" aria-hidden />
                <div>
                  {overallChange.delta > 0 ? (
                    <p className="font-medium text-success">
                      כל הכבוד! השתפרת ב-{overallChange.delta} נקודות (מ-{overallChange.from}% ל-{overallChange.to}%)
                    </p>
                  ) : overallChange.delta < 0 ? (
                    <p className="font-medium">
                      הציון הכולל ירד מעט (מ-{overallChange.from}% ל-{overallChange.to}%) - בוא/י נתרגל קצת יותר
                    </p>
                  ) : (
                    <p className="font-medium">הציון הכולל שלך יציב על {overallChange.to}%</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>מגמה כללית</CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <ProgressChart data={overall} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>לפי מיומנות</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pb-6">
              {bySkill.map((s) => (
                <div key={s.skillKey} className="flex flex-col gap-1">
                  <SkillBar label={s.skillName} value={s.currentScore} />
                  {s.changeFromFirst !== null && (
                    <span className={s.changeFromFirst >= 0 ? "text-xs text-success" : "text-xs text-muted-foreground"}>
                      {s.changeFromFirst > 0
                        ? `↑ השתפר/ה ב-${s.changeFromFirst} נקודות`
                        : s.changeFromFirst < 0
                          ? `↓ ירד ב-${Math.abs(s.changeFromFirst)} נקודות`
                          : "ללא שינוי"}
                    </span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
