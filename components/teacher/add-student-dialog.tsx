"use client";

import { useActionState, useState } from "react";
import { UserPlus, Copy, Check } from "lucide-react";
import { createStudentAction, type CreateStudentState } from "@/lib/actions/students";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const initialState: CreateStudentState = {};

function randomPassword() {
  const words = ["דג", "עץ", "שמש", "ים", "פרח", "כוכב", "ירח", "אריה"];
  const word = words[Math.floor(Math.random() * words.length)];
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `${word}${digits}`;
}

export function AddStudentDialog({ classId }: { classId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createStudentAction, initialState);
  const [createdInfo, setCreatedInfo] = useState<CreateStudentState["success"] | null>(null);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  // עדכון state בזמן רינדור (לא ב-effect) בתגובה להצלחת ה-action, ראו הערה מקבילה
  // ב-create-class-dialog.tsx
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.success) setCreatedInfo(state.success);
  }

  function reset() {
    setCreatedInfo(null);
    setPassword("");
    setCopied(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus />
          הוספת תלמיד/ה
        </Button>
      </DialogTrigger>
      <DialogContent>
        {createdInfo ? (
          <>
            <DialogHeader>
              <DialogTitle>החשבון נוצר בהצלחה 🎉</DialogTitle>
              <DialogDescription>
                שמרו/העתיקו את הפרטים והעבירו אותם ל{createdInfo.full_name} — הם לא יוצגו שוב
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">שם משתמש</span>
                <span className="font-mono font-medium">{createdInfo.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">סיסמה</span>
                <span className="font-mono font-medium">{createdInfo.password}</span>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigator.clipboard
                    .writeText(`שם משתמש: ${createdInfo.username}\nסיסמה: ${createdInfo.password}`)
                    .then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    });
                }}
              >
                {copied ? <Check /> : <Copy />}
                {copied ? "הועתק" : "העתקת הפרטים"}
              </Button>
            </div>
            <DialogFooter className="sm:justify-between">
              <Button type="button" variant="ghost" onClick={reset}>
                הוספת תלמיד/ה נוספ/ת
              </Button>
              <Button type="button" onClick={() => setOpen(false)}>
                סיום
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>הוספת תלמיד/ה לכיתה</DialogTitle>
              <DialogDescription>
                התלמיד/ה יתחבר/תתחבר עם שם המשתמש והסיסמה שתגדירו כאן
              </DialogDescription>
            </DialogHeader>
            <form action={formAction} className="flex flex-col gap-4">
              <input type="hidden" name="class_id" value={classId} />
              <div className="flex flex-col gap-2">
                <Label htmlFor="full_name">שם מלא</Label>
                <Input id="full_name" name="full_name" required autoComplete="off" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="username">שם משתמש (באנגלית)</Label>
                <Input id="username" name="username" required autoComplete="off" placeholder="lior_k" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">סיסמה</Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="off"
                    minLength={6}
                  />
                  <Button type="button" variant="outline" onClick={() => setPassword(randomPassword())}>
                    צור סיסמה
                  </Button>
                </div>
              </div>
              {state?.error && (
                <p role="alert" className="text-sm text-destructive">
                  {state.error}
                </p>
              )}
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "יוצר/ת..." : "הוספת תלמיד/ה"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
