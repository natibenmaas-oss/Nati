import Link from "next/link";
import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { AddStudentDialog } from "@/components/teacher/add-student-dialog";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: klass } = await supabase
    .from("classes")
    .select("id, name, grade_level")
    .eq("id", classId)
    .eq("teacher_id", user!.id)
    .maybeSingle();

  if (!klass) notFound();

  const { data: members } = await supabase
    .from("class_members")
    .select("student_id")
    .eq("class_id", classId);

  const studentIds = (members ?? []).map((m) => m.student_id);

  const [{ data: profiles }, { data: students }] = await Promise.all([
    studentIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", studentIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    studentIds.length
      ? supabase.from("students").select("id, reading_level, total_points").in("id", studentIds)
      : Promise.resolve({ data: [] as { id: string; reading_level: string; total_points: number }[] }),
  ]);

  const readingLevelById = new Map((students ?? []).map((s) => [s.id, s]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{klass.name}</h1>
          <p className="text-muted-foreground">שכבת {klass.grade_level}</p>
        </div>
        <AddStudentDialog classId={klass.id} />
      </div>

      {!profiles || profiles.length === 0 ? (
        <EmptyState
          icon={Users}
          title="אין עדיין תלמידים בכיתה הזו"
          description='לחצו על "הוספת תלמיד/ה" כדי ליצור עבורם חשבון'
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {profiles.map((p) => {
                const student = readingLevelById.get(p.id);
                return (
                  <li key={p.id}>
                    <Link
                      href={`/teacher/students/${p.id}`}
                      className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/50"
                    >
                      <span className="font-medium">{p.full_name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{student?.reading_level ?? "מתפתח"}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {student?.total_points ?? 0} נקודות
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
