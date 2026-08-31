import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, BookMarked, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAssignmentContext } from "@/lib/actions/reading-session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function PrepareStepPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const context = await getAssignmentContext(assignmentId);
  if (!context) notFound();

  const supabase = await createClient();
  const [{ data: text }, { data: vocabWords }] = await Promise.all([
    supabase
      .from("texts")
      .select("title, cover_icon, estimated_reading_time")
      .eq("id", context.textId)
      .single(),
    supabase.from("vocabulary_words").select("word, definition").eq("text_id", context.textId).limit(3),
  ]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
      <p className="text-sm font-medium text-primary">שלב 1 מתוך 5 · התכוננות לקריאה</p>

      <div className="flex size-24 items-center justify-center rounded-3xl bg-primary/10 text-6xl" aria-hidden>
        {text?.cover_icon ?? "📖"}
      </div>

      <h1 className="text-2xl font-bold">{text?.title}</h1>

      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Clock className="size-4" aria-hidden />
        זמן קריאה משוער: {text?.estimated_reading_time} דקות
      </p>

      {vocabWords && vocabWords.length > 0 && (
        <Card className="w-full">
          <CardContent className="flex flex-col gap-3 pt-6 pb-6 text-right">
            <p className="flex items-center gap-2 font-medium">
              <BookMarked className="size-5 text-primary" aria-hidden />
              3 מילים שכדאי להכיר
            </p>
            <ul className="flex flex-col gap-2">
              {vocabWords.map((v) => (
                <li key={v.word} className="text-sm">
                  <span className="font-medium">{v.word}</span>
                  <span className="text-muted-foreground"> — {v.definition}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Button asChild size="lg" className="mt-2">
        <Link href={`/student/assignment/${assignmentId}/read`}>
          המשך לקריאה
          <ArrowLeft />
        </Link>
      </Button>
    </div>
  );
}
