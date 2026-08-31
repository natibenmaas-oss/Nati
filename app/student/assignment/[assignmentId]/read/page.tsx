import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAssignmentContext } from "@/lib/actions/reading-session";
import { ReadingStep } from "@/components/student/reading-step";

export default async function ReadStepPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const context = await getAssignmentContext(assignmentId);
  if (!context) notFound();

  const supabase = await createClient();
  const { data: text } = await supabase.from("texts").select("title, content").eq("id", context.textId).single();
  if (!text) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-primary">שלב 2 מתוך 5 · קוראים</p>
        <h1 className="text-2xl font-bold">{text.title}</h1>
      </div>
      <ReadingStep assignmentId={assignmentId} textId={context.textId} content={text.content} />
    </div>
  );
}
