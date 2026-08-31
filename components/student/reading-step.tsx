"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mic, BookOpenText, Clock } from "lucide-react";
import { toast } from "sonner";
import { startReadingSession, finishReadingStep } from "@/lib/actions/reading-session";
import type { ReadingMode } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ReadingStep({
  assignmentId,
  textId,
  content,
}: {
  assignmentId: string;
  textId: string;
  content: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<ReadingMode | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!mode) return;
    const interval = setInterval(() => {
      if (startedAtRef.current) {
        setElapsed(Math.round((Date.now() - startedAtRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [mode]);

  function handleStart(selected: ReadingMode) {
    startTransition(async () => {
      // הערה: מצב "קריאה בקול" משתמש כרגע באותה מדידת זמן בסיסית כמו "קריאה שקטה".
      // ב-Phase 8 (Web Speech API) יתווסף כאן זיהוי דיבור אמיתי במצב aloud בלבד,
      // לשיפור הדיוק - אך המדד יישאר תמיד מסומן כ"משוער" (סעיף 11 במפרט).
      const result = await startReadingSession(assignmentId, textId, selected);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setSessionId(result.sessionId);
      setMode(selected);
      startedAtRef.current = Date.now();
    });
  }

  function handleFinish() {
    if (!sessionId || !startedAtRef.current) return;
    startTransition(async () => {
      const durationSeconds = Math.max(1, Math.round((Date.now() - startedAtRef.current!) / 1000));
      const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
      const wpmEstimated = Math.round((wordCount / durationSeconds) * 60);
      await finishReadingStep(sessionId, durationSeconds, wpmEstimated);
      router.push(`/student/assignment/${assignmentId}/comprehension`);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {!mode ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleStart("aloud")}
            className="flex flex-col items-center gap-2 rounded-xl border-2 border-transparent bg-primary/5 p-6 text-center transition-colors hover:border-primary focus-visible:border-primary focus-visible:outline-none disabled:opacity-50"
          >
            <Mic className="size-8 text-primary" aria-hidden />
            <span className="font-medium">קריאה בקול</span>
            <span className="text-xs text-muted-foreground">קרא/י את הטקסט בקול רם</span>
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleStart("silent")}
            className="flex flex-col items-center gap-2 rounded-xl border-2 border-transparent bg-primary/5 p-6 text-center transition-colors hover:border-primary focus-visible:border-primary focus-visible:outline-none disabled:opacity-50"
          >
            <BookOpenText className="size-8 text-primary" aria-hidden />
            <span className="font-medium">קריאה שקטה</span>
            <span className="text-xs text-muted-foreground">קרא/י בשקט לעצמך</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-medium">
            {mode === "aloud" ? <Mic className="size-4 text-primary" aria-hidden /> : <BookOpenText className="size-4 text-primary" aria-hidden />}
            {mode === "aloud" ? "קוראים בקול..." : "קוראים בשקט..."}
          </span>
          <span className="flex items-center gap-1 text-sm text-muted-foreground" aria-live="polite">
            <Clock className="size-4" aria-hidden />
            {formatElapsed(elapsed)}
          </span>
        </div>
      )}

      <Card>
        <CardContent className="pt-6 pb-6">
          <p className="whitespace-pre-line text-lg leading-9">{content}</p>
        </CardContent>
      </Card>

      {mode && (
        <Button size="lg" className="self-center" onClick={handleFinish} disabled={isPending}>
          {isPending ? "רגע..." : "סיימתי לקרוא"}
        </Button>
      )}
    </div>
  );
}
