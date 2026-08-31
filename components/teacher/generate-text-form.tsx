"use client";

import { useActionState, useTransition } from "react";
import { Sparkles, Save } from "lucide-react";
import { toast } from "sonner";
import {
  generateTextAction,
  saveGeneratedTextAction,
  type GenerateTextActionState,
} from "@/lib/actions/ai-text-generator";
import { GENRES, DIFFICULTIES, GRADE_LEVELS_FULL } from "@/lib/validation/texts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const initialState: GenerateTextActionState = {};

const TYPE_LABELS: Record<string, string> = {
  explicit: "מידע מפורש",
  main_idea: "רעיון מרכזי",
  vocabulary: "אוצר מילים",
  evidence: "הוכחה מהטקסט",
  inference: "הסקת מסקנות",
  critical: "חשיבה ביקורתית",
  mcq: "רב-ברירה",
};

export function GenerateTextForm({ skills }: { skills: { id: string; name_he: string }[] }) {
  const [state, formAction, isPending] = useActionState(generateTextAction, initialState);
  const [isSaving, startSaving] = useTransition();

  function handleSave() {
    if (!state.draft || !state.meta) return;
    startSaving(async () => {
      const result = await saveGeneratedTextAction(state.draft!, state.meta!);
      if (result.error) toast.error(result.error);
    });
  }

  if (state.draft) {
    const { draft } = state;
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6 pb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden>
                {draft.cover_icon}
              </span>
              <h2 className="text-xl font-bold">{draft.title}</h2>
              <Badge>נוצר ב-AI ✨</Badge>
            </div>
            <p className="whitespace-pre-line leading-8">{draft.content}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-2 pt-6 pb-6">
            <p className="font-medium">מילים שכדאי להכיר</p>
            <ul className="flex flex-col gap-1 text-sm">
              {draft.vocabulary_words.map((v) => (
                <li key={v.word}>
                  <span className="font-medium">{v.word}</span> — {v.definition}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3 pt-6 pb-6">
            <p className="font-medium">שאלות ({draft.questions.length})</p>
            <ul className="flex flex-col divide-y">
              {draft.questions.map((q, i) => (
                <li key={i} className="flex flex-col gap-1 py-2">
                  <Badge variant="outline" className="w-fit">
                    {TYPE_LABELS[q.type] ?? q.type}
                  </Badge>
                  <p className="text-sm">{q.question_text}</p>
                  {q.options && (
                    <ul className="ms-4 list-disc text-xs text-muted-foreground">
                      {q.options.map((o, oi) => (
                        <li key={oi} className={oi === q.correct_option_index ? "font-medium text-success" : ""}>
                          {o.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button size="lg" onClick={handleSave} disabled={isSaving}>
            <Save />
            {isSaving ? "שומר/ת..." : "שמירה לבנק הטקסטים"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 pb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="gradeLevel">כיתה</Label>
              <Select name="gradeLevel" defaultValue="ד׳">
                <SelectTrigger id="gradeLevel" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_LEVELS_FULL.map((g) => (
                    <SelectItem key={g} value={g}>
                      כיתה {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="topic">נושא</Label>
              <Input id="topic" name="topic" required placeholder="לדוגמה: חלל" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="genre">סוג טקסט</Label>
              <Select name="genre" defaultValue={GENRES[1]}>
                <SelectTrigger id="genre" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="difficulty">רמת קושי</Label>
              <Select name="difficulty" defaultValue="בינוני">
                <SelectTrigger id="difficulty" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="approxWordCount">אורך (מילים)</Label>
              <Input id="approxWordCount" name="approxWordCount" type="number" min={50} max={1000} defaultValue={300} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="purposeSkillId">מטרת התרגול</Label>
            <Select name="purposeSkillId" defaultValue={skills[0]?.id}>
              <SelectTrigger id="purposeSkillId" className="w-full">
                <SelectValue placeholder="בחר/י מיומנות" />
              </SelectTrigger>
              <SelectContent>
                {skills.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name_he}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isPending}>
          <Sparkles />
          {isPending ? "יוצר/ת טקסט..." : "יצירת טקסט"}
        </Button>
      </div>
    </form>
  );
}
