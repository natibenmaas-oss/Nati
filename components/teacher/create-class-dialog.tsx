"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { createClassAction, type ClassActionState } from "@/lib/actions/classes";
import { GRADE_LEVELS } from "@/lib/validation/classes";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const initialState: ClassActionState = {};

export function CreateClassDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createClassAction, initialState);

  // סוגר את הדיאלוג ברגע שהפעולה הצליחה. זה עדכון state בזמן רינדור (לא ב-effect) —
  // הדפוס המומלץ ב-React להתאמת state כתגובה לשינוי בפרופ/state אחר, ראו:
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.success) setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus />
          כיתה חדשה
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>יצירת כיתה חדשה</DialogTitle>
          <DialogDescription>אחר כך תוכל/י להוסיף אליה תלמידים</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">שם הכיתה</Label>
            <Input id="name" name="name" placeholder='לדוגמה: כיתה ד׳1' required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="grade_level">שכבת גיל</Label>
            <Select name="grade_level" defaultValue={GRADE_LEVELS[3]}>
              <SelectTrigger id="grade_level" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRADE_LEVELS.map((g) => (
                  <SelectItem key={g} value={g}>
                    כיתה {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {state?.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "יוצר/ת..." : "יצירת כיתה"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
