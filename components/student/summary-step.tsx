"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { submitReflection } from "@/lib/actions/reading-session";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function SummaryStep({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) {
      toast.error("כתוב/כתבי כמה מילים על מה שלמדת");
      return;
    }
    startTransition(async () => {
      const rewards = await submitReflection(sessionId, text.trim());
      const params = new URLSearchParams({ completed: "1" });
      if (rewards) {
        params.set("points", String(rewards.pointsAwarded));
        if (rewards.newAchievements.length > 0) {
          params.set("newAchievements", String(rewards.newAchievements.length));
        }
      }
      router.push(`/student/dashboard?${params.toString()}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Label htmlFor="reflection" className="text-base font-medium">
        במילים שלך - מה למדת מהטקסט הזה?
      </Label>
      <Textarea
        id="reflection"
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="כתוב/כתבי כאן בחופשיות..."
      />
      <Button type="submit" size="lg" className="self-center" disabled={isPending}>
        {isPending ? "שומר/ת..." : "סיום המשימה 🎉"}
      </Button>
    </form>
  );
}
