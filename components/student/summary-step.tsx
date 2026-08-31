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
      await submitReflection(sessionId, text.trim());
      router.push("/student/dashboard?completed=1");
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
