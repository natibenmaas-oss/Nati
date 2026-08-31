import Link from "next/link";
import { Users, GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { CreateClassDialog } from "@/components/teacher/create-class-dialog";

export const metadata = { title: "כיתות — ReadWise AI" };

export default async function TeacherClassesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, grade_level, created_at")
    .eq("teacher_id", user!.id)
    .order("created_at", { ascending: false });

  const { data: members } = await supabase.from("class_members").select("class_id");
  const countByClass = new Map<string, number>();
  for (const m of members ?? []) {
    countByClass.set(m.class_id, (countByClass.get(m.class_id) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">הכיתות שלי</h1>
          <p className="text-muted-foreground">ניהול כיתות והתלמידים בהן</p>
        </div>
        <CreateClassDialog />
      </div>

      {!classes || classes.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="עדיין לא יצרת כיתה"
          description='לחצו על "כיתה חדשה" כדי להתחיל'
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <Link key={c.id} href={`/teacher/classes/${c.id}`}>
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="size-5 text-primary" aria-hidden />
                    {c.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-2 pb-6 text-sm text-muted-foreground">
                  <Users className="size-4" aria-hidden />
                  {countByClass.get(c.id) ?? 0} תלמידים · שכבת {c.grade_level}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
