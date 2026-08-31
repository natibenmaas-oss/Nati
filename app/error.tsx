"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive" aria-hidden>
        <AlertTriangle className="size-8" />
      </div>
      <h1 className="text-2xl font-bold">משהו השתבש</h1>
      <p className="max-w-sm text-muted-foreground">
        קרתה שגיאה בלתי צפויה. אפשר לנסות שוב - הנתונים שלך שמורים.
      </p>
      <Button size="lg" onClick={() => reset()}>
        ניסיון נוסף
      </Button>
    </main>
  );
}
