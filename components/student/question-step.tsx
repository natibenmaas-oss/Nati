"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lightbulb, CheckCircle2, HelpCircle, Loader2 } from "lucide-react";
import { submitAndEvaluateAnswers, requestHint, resubmitAnswer, type QuestionResult } from "@/lib/actions/reading-session";
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

interface UiResult extends QuestionResult {
  hint?: string;
  isFinalExplanation?: boolean;
  hintPending?: boolean;
  showRetryBox?: boolean;
}

function AnswerInput({
  question,
  value,
  onChange,
  disabled,
}: {
  question: StepQuestion;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  if (question.type === "mcq" && question.options) {
    return (
      <RadioGroup value={value} onValueChange={onChange}>
        {question.options.map((opt) => (
          <label
            key={opt.key}
            className="flex items-center gap-2 rounded-md border p-3 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 has-[[data-disabled]]:opacity-60"
          >
            <RadioGroupItem value={opt.key} disabled={disabled} />
            {opt.label}
          </label>
        ))}
      </RadioGroup>
    );
  }
  return (
    <Textarea
      rows={3}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder="כתוב/כתבי את תשובתך כאן..."
    />
  );
}

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
  const [phase, setPhase] = useState<"answering" | "results">("answering");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, UiResult>>({});
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  function handleInitialSubmit(e: React.FormEvent) {
    e.preventDefault();
    const missing = questions.some((q) => !answers[q.id]?.trim());
    if (missing) {
      toast.error("יש לענות על כל השאלות לפני שממשיכים");
      return;
    }
    startSubmitTransition(async () => {
      const serverResults = await submitAndEvaluateAnswers(
        sessionId,
        questions.map((q) => ({ questionId: q.id, answer: answers[q.id] }))
      );
      setResults(serverResults);
      setPhase("results");
    });
  }

  function handleRequestHint(questionId: string) {
    setPendingActionId(questionId);
    startSubmitTransition(async () => {
      const hintRes = await requestHint(sessionId, questionId, answers[questionId] ?? "");
      setResults((prev) => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          hint: hintRes.hint,
          isFinalExplanation: hintRes.isFinalExplanation,
          hintsUsed: hintRes.hintsUsed,
          showRetryBox: true,
        },
      }));
      setPendingActionId(null);
    });
  }

  function handleResubmit(questionId: string) {
    setPendingActionId(questionId);
    startSubmitTransition(async () => {
      const r = await resubmitAnswer(sessionId, questionId, answers[questionId] ?? "");
      setResults((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], ...r, hint: undefined, showRetryBox: false },
      }));
      setPendingActionId(null);
    });
  }

  if (phase === "answering") {
    return (
      <form onSubmit={handleInitialSubmit} className="flex flex-col gap-5">
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
              <AnswerInput
                question={q}
                value={answers[q.id] ?? ""}
                onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
              />
            </CardContent>
          </Card>
        ))}

        <Button type="submit" size="lg" className="self-center" disabled={isSubmitting}>
          {isSubmitting ? "בודק/ת תשובות..." : "בדיקת תשובות"}
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {questions.map((q, i) => {
        const result = results[q.id];
        const needsWork = result && result.isCorrect === false;
        const canHint = needsWork && result.hintsUsed < 3;

        return (
          <Card key={q.id}>
            <CardContent className="flex flex-col gap-3 pt-6 pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">שאלה {i + 1}</Badge>
                <Badge variant="outline">{TYPE_LABELS[q.type] ?? q.type}</Badge>
                {result?.isCorrect === true && (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="size-3" /> נכון
                  </Badge>
                )}
                {result?.isCorrect === false && <Badge variant="warning">כדאי לנסות שוב</Badge>}
                {result?.isCorrect === null && <Badge variant="outline">ממתין לבדיקה</Badge>}
              </div>

              <p className="text-base font-medium">{q.question_text}</p>
              <AnswerInput question={q} value={answers[q.id] ?? ""} onChange={() => {}} disabled />

              {result?.feedback && (
                <p className="rounded-md bg-muted/50 p-3 text-sm">{result.feedback}</p>
              )}

              {result?.hint && (
                <p className="flex items-start gap-2 rounded-md bg-primary/5 p-3 text-sm text-primary">
                  <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {result.hint}
                </p>
              )}

              {needsWork && (
                <div className="flex flex-wrap items-center gap-2">
                  {canHint && !result.showRetryBox && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRequestHint(q.id)}
                      disabled={isSubmitting}
                    >
                      {pendingActionId === q.id && isSubmitting ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <HelpCircle />
                      )}
                      רוצה רמז?
                    </Button>
                  )}
                </div>
              )}

              {result?.showRetryBox && (
                <div className="flex flex-col gap-2 rounded-md border border-dashed p-3">
                  <Label htmlFor={`retry-${q.id}`} className="text-sm">
                    נסה/י שוב:
                  </Label>
                  <AnswerInput
                    question={q}
                    value={answers[q.id] ?? ""}
                    onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="self-start"
                    onClick={() => handleResubmit(q.id)}
                    disabled={isSubmitting}
                  >
                    {pendingActionId === q.id && isSubmitting ? "בודק/ת..." : "שליחה מחדש"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Button type="button" size="lg" className="self-center" onClick={() => router.push(nextHref)}>
        המשך
      </Button>
    </div>
  );
}
