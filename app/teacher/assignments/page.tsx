import Link from "next/link";
import { Plus, ClipboardList, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata = { title: "משימות — ReadWise AI" };

export default async function TeacherAssignmentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, title, due_date, class_id, text_id")
    .eq("teacher_id", user!.id)
    .order("created_at", { ascending: false });

  const classIds = Array.from(new Set((assignments ?? []).map((a) => a.class_id)));
  const textIds = Array.from(new Set((assignments ?? []).map((a) => a.text_id)));
  const assignmentIds = (assignments ?? []).map((a) => a.id);

  const [{ data: classes }, { data: texts }, { data: submissions }, { data: members }] = await Promise.all([
    classIds.length ? supabase.from("classes").select("id, name").in("id", classIds) : Promise.resolve({ data: [] }),
    textIds.length ? supabase.from("texts").select("id, title").in("id", textIds) : Promise.resolve({ data: [] }),
    assignmentIds.length
      ? supabase.from("assignment_submissions").select("assignment_id, status").in("assignment_id", assignmentIds)
      : Promise.resolve({ data: [] }),
    classIds.length ? supabase.from("class_members").select("class_id").in("class_id", classIds) : Promise.resolve({ data: [] }),
  ]);

  const classNameById = new Map((classes ?? []).map((c) => [c.id, c.name]));
  const textTitleById = new Map((texts ?? []).map((t) => [t.id, t.title]));
  const studentCountByClass = new Map<string, number>();
  for (const m of members ?? []) {
    studentCountByClass.set(m.class_id, (studentCountByClass.get(m.class_id) ?? 0) + 1);
  }
  const completedByAssignment = new Map<string, number>();
  for (const s of submissions ?? []) {
    if (s.status === "completed") {
      completedByAssignment.set(s.assignment_id, (completedByAssignment.get(s.assignment_id) ?? 0) + 1);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">משימות קריאה</h1>
          <p className="text-muted-foreground">הקצאה ומעקב אחר משימות קריאה לכיתות שלך</p>
        </div>
        <Button asChild>
          <Link href="/teacher/assignments/new">
            <Plus />
            משימה חדשה
          </Link>
        </Button>
      </div>

      {!assignments || assignments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="עדיין לא יצרת משימות קריאה"
          description='לחצו על "משימה חדשה" כדי לבחור טקסט ולהקצות אותו לכיתה'
        />
      ) : (
        <div className="flex flex-col gap-3">
          {assignments.map((a) => {
            const total = studentCountByClass.get(a.class_id) ?? 0;
            const completed = completedByAssignment.get(a.id) ?? 0;
            return (
              <Card key={a.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{a.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pb-6">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary">{classNameById.get(a.class_id) ?? "כיתה"}</Badge>
                    <span>{textTitleById.get(a.text_id) ?? "טקסט"}</span>
                    {a.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3.5" aria-hidden />
                        {new Date(a.due_date).toLocaleDateString("he-IL")}
                      </span>
                    )}
                  </div>
                  <Badge variant={completed === total && total > 0 ? "success" : "outline"}>
                    {completed}/{total} הושלמו
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
