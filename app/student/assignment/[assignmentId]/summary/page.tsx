import { notFound, redirect } from "next/navigation";
import { getAssignmentContext, getActiveSession } from "@/lib/actions/reading-session";
import { SummaryStep } from "@/components/student/summary-step";

export default async function SummaryStepPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const context = await getAssignmentContext(assignmentId);
  if (!context) notFound();

  const session = await getActiveSession(assignmentId, context.textId);
  if (!session) redirect(`/student/assignment/${assignmentId}/prepare`);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-primary">שלב 5 מתוך 5 · סיכום</p>
      <h1 className="text-2xl font-bold">{context.title}</h1>
      <SummaryStep sessionId={session.id} />
    </div>
  );
}
