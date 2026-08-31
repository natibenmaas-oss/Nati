"use client";

import { useState, useTransition } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { regenerateRecommendationAction, type StoredRecommendation } from "@/lib/actions/recommendations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";

export function AiRecommendationPanel({
  studentId,
  initialRecommendation,
}: {
  studentId: string;
  initialRecommendation: StoredRecommendation | null;
}) {
  const [recommendation, setRecommendation] = useState(initialRecommendation);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await regenerateRecommendationAction(studentId);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.data) setRecommendation(result.data);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {recommendation ? (
        <div className="flex flex-col gap-2 rounded-lg bg-primary/5 p-4">
          {recommendation.focusSkillName && (
            <Badge className="w-fit">מיקוד מומלץ: {recommendation.focusSkillName}</Badge>
          )}
          <p className="whitespace-pre-line text-sm leading-6">{recommendation.text}</p>
          <p className="text-xs text-muted-foreground">
            עודכן: {new Date(recommendation.generatedAt).toLocaleDateString("he-IL")}
          </p>
        </div>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="עדיין אין המלצת AI"
          description="לחצו על הכפתור כדי לייצר המלצה מותאמת אישית על סמך נתוני הקריאה של התלמיד/ה."
        />
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button variant="outline" size="sm" className="self-start" onClick={handleGenerate} disabled={isPending}>
        <RefreshCw className={isPending ? "animate-spin" : ""} />
        {isPending ? "מנתח/ת נתונים..." : recommendation ? "רענון המלצה" : "יצירת המלצת AI"}
      </Button>
    </div>
  );
}
