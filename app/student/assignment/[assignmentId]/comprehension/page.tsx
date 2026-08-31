import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAssignmentContext, getActiveSession } from "@/lib/actions/reading-session";
import Link from "next/link";
import { COMPREHENSION_STEP_TYPES } from "@/lib/validation/questions";
import { QuestionStep } from "@/components/student/question-step";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

export default async function ComprehensionStepPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const context = await getAssignmentContext(assignmentId);
  if (!context) notFound();

  const session = await getActiveSession(assignmentId, context.textId);
  if (!session) redirect(`/student/assignment/${assignmentId}/prepare`);

  const supabase = await createClient();
  const { data: questions } = await supabase
    .from("questions")
    .select("id, type, question_text, options")
    .eq("text_id", context.textId)
    .in("type", COMPREHENSION_STEP_TYPES)
    .order("order_index");

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-primary">שלב 3 מתוך 5 · הבנת הטקסט</p>
      <h1 className="text-2xl font-bold">{context.title}</h1>

      {!questions || questions.length === 0 ? (
        <>
          <EmptyState
            icon={HelpCircle}
            title="אין עדיין שאלות לטקסט הזה"
            description="פנה/י למורה שלך - נראה שעדיין לא נוספו שאלות הבנה לטקסט."
          />
          <Button asChild size="lg" className="self-center">
            <Link href={`/student/assignment/${assignmentId}/challenge`}>המשך</Link>
          </Button>
        </>
      ) : (
        <QuestionStep
          sessionId={session.id}
          questions={questions}
          nextHref={`/student/assignment/${assignmentId}/challenge`}
        />
      )}
    </div>
  );
}
