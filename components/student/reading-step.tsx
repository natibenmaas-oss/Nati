"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mic, BookOpenText, Clock, Gauge, PauseCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { startReadingSession, finishReadingStep } from "@/lib/actions/reading-session";
import { useSpeechRecognition, isSpeechRecognitionSupported } from "@/lib/speech/useSpeechRecognition";
import { estimateRecognitionAccuracy } from "@/lib/speech/estimate-accuracy";
import type { ReadingMode } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface AloudSummary {
  wpm: number | null;
  pauseCount: number;
  accuracy: number | null;
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
  const [aloudSummary, setAloudSummary] = useState<AloudSummary | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const speech = useSpeechRecognition();
  // אינו משפיע על ה-JSX המוצג, רק על לוגיקה בתוך handleStart/handleFinish,
  // ולכן אין כאן סיכון ל-hydration mismatch שמצדיק state+effect.
  const speechSupportedRef = useRef(isSpeechRecognitionSupported());
  const speechSupported = speechSupportedRef.current;

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
      const result = await startReadingSession(assignmentId, textId, selected);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setSessionId(result.sessionId);
      setMode(selected);
      startedAtRef.current = Date.now();

      if (selected === "aloud") {
        if (!speechSupported) {
          toast.info("זיהוי דיבור אינו נתמך בדפדפן הזה - נמדוד רק את זמן הקריאה");
        } else {
          const started = speech.start();
          if (!started && speech.error) toast.info(speech.error);
        }
      }
    });
  }

  function handleFinish() {
    if (!sessionId || !startedAtRef.current) return;

    startTransition(async () => {
      const durationSeconds = Math.max(1, Math.round((Date.now() - startedAtRef.current!) / 1000));

      if (mode === "aloud" && speechSupported) {
        const speechResult = speech.stop();
        const accuracy = estimateRecognitionAccuracy(speechResult.recognizedText, content);
        const wpm =
          speechResult.recognizedWordCount > 0
            ? Math.round((speechResult.recognizedWordCount / speechResult.speakingDurationSeconds) * 60)
            : null;

        await finishReadingStep(sessionId, {
          durationSeconds,
          wpmEstimated: wpm,
          recognizedWordCount: speechResult.recognizedWordCount,
          pauseCount: speechResult.pauseCount,
          recognizedAccuracy: accuracy,
        });

        setAloudSummary({ wpm, pauseCount: speechResult.pauseCount, accuracy });
        return; // ממתינים ללחיצה על "המשך" במסך הסיכום
      }

      const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
      const wpmEstimated = Math.round((wordCount / durationSeconds) * 60);
      await finishReadingStep(sessionId, { durationSeconds, wpmEstimated });
      router.push(`/student/assignment/${assignmentId}/comprehension`);
    });
  }

  if (aloudSummary) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
        <h2 className="text-xl font-bold">כל הכבוד על הקריאה! 🎉</h2>
        <Card className="w-full">
          <CardContent className="flex flex-col gap-3 pt-6 pb-6">
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Info className="size-3.5" aria-hidden />
              המדדים הבאים משוערים בלבד (מבוססים על זיהוי דיבור אוטומטי)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-3">
                <Gauge className="size-5 text-primary" aria-hidden />
                <span className="font-bold">{aloudSummary.wpm ?? "—"}</span>
                <span className="text-xs text-muted-foreground">מילים לדקה (משוער)</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-3">
                <PauseCircle className="size-5 text-primary" aria-hidden />
                <span className="font-bold">{aloudSummary.pauseCount}</span>
                <span className="text-xs text-muted-foreground">עצירות (משוער)</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Button size="lg" onClick={() => router.push(`/student/assignment/${assignmentId}/comprehension`)}>
          המשך
        </Button>
      </div>
    );
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
            {mode === "aloud" ? (
              <Mic className={speech.isListening ? "size-4 animate-pulse text-primary" : "size-4 text-primary"} aria-hidden />
            ) : (
              <BookOpenText className="size-4 text-primary" aria-hidden />
            )}
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
