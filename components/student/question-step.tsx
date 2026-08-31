"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { submitAnswers } from "@/lib/actions/reading-session";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface StepQuestion {
  id: string;
  type: string;
  question_text: string;
  options: { key: string; label: string }[] | null;
}

const TYPE_LABELS: Record<string, string> = {
  explicit: "מידע מפורש",
  main_idea: "רעיון מרכזי",
  vocabulary: "אוצר מילים",
  evidence: "הוכחה מהטקסט",
  inference: "הסקת מסקנות",
  critical: "חשיבה ביקורתית",
  mcq: "שאלה",
};

export function QuestionStep({
  sessionId,
  questions,
  nextHref,
}: {
  sessionId: string;
  questions: StepQuestion[];
  nextHref: string;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const missing = questions.some((q) => !answers[q.id]?.trim());
    if (missing) {
      toast.error("יש לענות על כל השאלות לפני שממשיכים");
      return;
    }
    startTransition(async () => {
      await submitAnswers(
        sessionId,
        questions.map((q) => ({ questionId: q.id, answer: answers[q.id] }))
      );
      router.push(nextHref);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {questions.map((q, i) => (
        <Card key={q.id}>
          <CardContent className="flex flex-col gap-3 pt-6 pb-6">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">שאלה {i + 1}</Badge>
              <Badge variant="outline">{TYPE_LABELS[q.type] ?? q.type}</Badge>
            </div>
            <Label htmlFor={`q-${q.id}`} className="text-base font-medium">
              {q.question_text}
            </Label>

            {q.type === "mcq" && q.options ? (
              <RadioGroup
                value={answers[q.id] ?? ""}
                onValueChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
              >
                {q.options.map((opt) => (
                  <label
                    key={opt.key}
                    className="flex items-center gap-2 rounded-md border p-3 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                  >
                    <RadioGroupItem value={opt.key} />
                    {opt.label}
                  </label>
                ))}
              </RadioGroup>
            ) : (
              <Textarea
                id={`q-${q.id}`}
                rows={3}
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                placeholder="כתוב/כתבי את תשובתך כאן..."
              />
            )}
          </CardContent>
        </Card>
      ))}

      <Button type="submit" size="lg" className="self-center" disabled={isPending}>
        {isPending ? "שומר/ת..." : "המשך"}
      </Button>
    </form>
  );
}
