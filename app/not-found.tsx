import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground" aria-hidden>
        <FileQuestion className="size-8" />
      </div>
      <h1 className="text-2xl font-bold">הדף לא נמצא</h1>
      <p className="max-w-sm text-muted-foreground">
        ייתכן שהקישור שגוי, או שהדף הוסר. אפשר לחזור לדף הבית ולנסות שוב.
      </p>
      <Button asChild size="lg">
        <Link href="/">חזרה לדף הבית</Link>
      </Button>
    </main>
  );
}
