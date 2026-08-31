import { notFound } from "next/navigation";
import { Sparkles, ThumbsUp, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getStudentProfileData } from "@/lib/scoring/student-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkillBar } from "@/components/shared/skill-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { TeacherNotesPanel } from "@/components/teacher/teacher-notes-panel";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", studentId)
    .maybeSingle();
  const { data: student } = await supabase
    .from("students")
    .select("reading_level, total_points, current_streak")
    .eq("id", studentId)
    .maybeSingle();

  if (!profile || !student) notFound();

  const [{ skills, strengths, weaknesses }, { data: notes }] = await Promise.all([
    getStudentProfileData(studentId),
    supabase
      .from("teacher_notes")
      .select("id, note_text, created_at")
      .eq("teacher_id", user!.id)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{profile.full_name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge>{student.reading_level}</Badge>
            <span className="text-sm text-muted-foreground">
              {student.total_points} נקודות · רצף {student.current_streak} ימים
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThumbsUp className="size-5 text-success" aria-hidden />
              חוזקות
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            {strengths.length === 0 ? (
              <p className="text-sm text-muted-foreground">עדיין אין מספיק נתונים לזיהוי חוזקות</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {strengths.map((s) => (
                  <li key={s.skillKey} className="text-sm">
                    {s.skillName}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-5 text-warning-foreground" aria-hidden />
              תחומים לחיזוק
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            {weaknesses.length === 0 ? (
              <p className="text-sm text-muted-foreground">עדיין אין מספיק נתונים לזיהוי תחומים לחיזוק</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {weaknesses.map((s) => (
                  <li key={s.skillKey} className="text-sm">
                    {s.skillName}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>מדדים</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          {skills.length === 0 ? (
            <EmptyState
              icon={Target}
              title="עדיין אין נתוני קריאה"
              description="המדדים יופיעו כאן לאחר שהתלמיד/ה יבצע/תבצע משימות קריאה."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {skills.map((s) => (
                <SkillBar key={s.skillKey} label={s.skillName} value={s.score} sampleSize={s.sampleSize} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" aria-hidden />
            המלצת AI
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <EmptyState
            icon={Sparkles}
            title="בבנייה"
            description="המלצת AI מותאמת אישית לתלמיד/ה, המבוססת על ניתוח נתוני הקריאה שלו/שלה, תתווסף בשלב מנוע ההתאמה האישית."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>הערות מורה</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <TeacherNotesPanel studentId={studentId} notes={notes ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
