import { notFound } from "next/navigation";
import { Clock, BookMarked, HelpCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";

export default async function TextDetailPage({
  params,
}: {
  params: Promise<{ textId: string }>;
}) {
  const { textId } = await params;
  const supabase = await createClient();

  const { data: text } = await supabase.from("texts").select("*").eq("id", textId).maybeSingle();
  if (!text) notFound();

  const { data: vocabWords } = await supabase
    .from("vocabulary_words")
    .select("id, word, definition, example_sentence")
    .eq("text_id", textId);

  const { count: questionsCount } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("text_id", textId);

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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="size-5 text-primary" aria-hidden />
            שאלות ({questionsCount ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <EmptyState
            icon={HelpCircle}
            title="בבנייה"
            description="יצירת שאלות הבנה, הסקה, אוצר מילים ורעיון מרכזי לטקסט זה תתאפשר בשלב ה-Question Engine."
          />
        </CardContent>
      </Card>
    </div>
  );
}
