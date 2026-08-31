import { notFound } from "next/navigation";
import { Clock, BookMarked, HelpCircle, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { AddQuestionDialog } from "@/components/teacher/add-question-dialog";
import { QUESTION_TYPES } from "@/lib/validation/questions";
import { deleteQuestionAction } from "@/lib/actions/questions";

const typeLabel = (type: string) => QUESTION_TYPES.find((t) => t.value === type)?.label ?? type;

export default async function TextDetailPage({
  params,
}: {
  params: Promise<{ textId: string }>;
}) {
  const { textId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: text } = await supabase.from("texts").select("*").eq("id", textId).maybeSingle();
  if (!text) notFound();
  const isOwner = text.created_by === user?.id;

  const [{ data: vocabWords }, { data: questions }, { data: skills }] = await Promise.all([
    supabase
      .from("vocabulary_words")
      .select("id, word, definition, example_sentence")
      .eq("text_id", textId),
    supabase
      .from("questions")
      .select("id, type, question_text, difficulty, skill_id")
      .eq("text_id", textId)
      .order("order_index"),
    supabase.from("skills").select("id, name_he"),
  ]);

  const skillNameById = new Map((skills ?? []).map((s) => [s.id, s.name_he]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden>
            {text.cover_icon}
          </span>
          <h1 className="text-2xl font-bold">{text.title}</h1>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge variant="secondary">{text.genre}</Badge>
          <Badge variant="outline">{text.difficulty}</Badge>
          <Badge variant="outline">כיתה {text.grade_level}</Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="size-3" aria-hidden />
            {text.estimated_reading_time} דקות
          </Badge>
          {text.is_ai_generated && <Badge>נוצר ב-AI ✨</Badge>}
          {text.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              #{tag}
            </Badge>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 pb-6">
          <p className="whitespace-pre-line leading-8">{text.content}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookMarked className="size-5 text-primary" aria-hidden />
            מילים שכדאי להכיר
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          {!vocabWords || vocabWords.length === 0 ? (
            <p className="text-sm text-muted-foreground">לא הוגדרו מילות אוצר מילים לטקסט זה</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {vocabWords.map((v) => (
                <li key={v.id}>
                  <span className="font-medium">{v.word}</span>
                  <span className="text-muted-foreground"> — {v.definition}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="size-5 text-primary" aria-hidden />
            שאלות ({questions?.length ?? 0})
          </CardTitle>
          {isOwner && <AddQuestionDialog textId={textId} skills={skills ?? []} />}
        </CardHeader>
        <CardContent className="pb-6">
          {!questions || questions.length === 0 ? (
            <EmptyState
              icon={HelpCircle}
              title="אין עדיין שאלות לטקסט הזה"
              description={
                isOwner
                  ? 'לחצו על "שאלה חדשה" כדי להוסיף שאלות הבנה, הסקה, אוצר מילים ורעיון מרכזי.'
                  : "רק היוצר/ת של הטקסט יכול/ה להוסיף לו שאלות."
              }
            />
          ) : (
            <ul className="flex flex-col divide-y">
              {questions.map((q) => (
                <li key={q.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <div className="mb-1 flex flex-wrap gap-1.5">
                      <Badge variant="secondary">{typeLabel(q.type)}</Badge>
                      <Badge variant="outline">{q.difficulty}</Badge>
                      {q.skill_id && <Badge variant="outline">{skillNameById.get(q.skill_id)}</Badge>}
                    </div>
                    <p className="text-sm">{q.question_text}</p>
                  </div>
                  {isOwner && (
                    <form action={deleteQuestionAction.bind(null, q.id, textId)}>
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        aria-label="מחיקת שאלה"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 />
                      </Button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
