import { createClient } from "@/lib/supabase/server";
import { CreateAssignmentForm } from "@/components/teacher/create-assignment-form";

export const metadata = { title: "משימה חדשה — ReadWise AI" };

export default async function NewAssignmentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: classes }, { data: texts }, { data: skills }] = await Promise.all([
    supabase.from("classes").select("id, name").eq("teacher_id", user!.id),
    supabase.from("texts").select("id, title").order("title"),
    supabase.from("skills").select("id, name_he"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">משימת קריאה חדשה</h1>
        <p className="text-muted-foreground">בחרו כיתה, טקסט ומיומנות מיקוד</p>
      </div>
      <CreateAssignmentForm classes={classes ?? []} texts={texts ?? []} skills={skills ?? []} />
    </div>
  );
}
