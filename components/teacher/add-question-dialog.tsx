"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { createQuestionAction, type QuestionActionState } from "@/lib/actions/questions";
import { QUESTION_TYPES, DIFFICULTIES } from "@/lib/validation/questions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const initialState: QuestionActionState = {};

export function AddQuestionDialog({
  textId,
  skills,
}: {
  textId: string;
  skills: { id: string; name_he: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("explicit");
  const [state, formAction, isPending] = useActionState(createQuestionAction, initialState);

  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.success) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus />
          שאלה חדשה
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>הוספת שאלה</DialogTitle>
          <DialogDescription>שאלה תתווסף לטקסט זה</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="text_id" value={textId} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="type">סוג שאלה</Label>
            <Select name="type" value={type} onValueChange={setType}>
              <SelectTrigger id="type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="question_text">נוסח השאלה</Label>
            <Textarea id="question_text" name="question_text" required rows={2} />
          </div>

          {type === "mcq" ? (
            <div className="flex flex-col gap-2">
              <Label>אפשרויות (סמנו את הנכונה)</Label>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct_option"
                    value={String(i)}
                    required={i === 1}
                    className="size-4 accent-primary"
                    aria-label={`אפשרות ${i} נכונה`}
                  />
                  <Input name={`option_${i}`} placeholder={`אפשרות ${i}`} required={i <= 2} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="correct_answer">
                תשובה לדוגמה / קו מנחה לבדיקה {type !== "critical" && "(אופציונלי אם אין תשובה יחידה)"}
              </Label>
              <Textarea id="correct_answer" name="correct_answer" rows={2} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="difficulty">רמת קושי</Label>
              <Select name="difficulty" defaultValue="בינוני">
                <SelectTrigger id="difficulty" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="skill_id">מיומנות (אופציונלי)</Label>
              <Select name="skill_id">
                <SelectTrigger id="skill_id" className="w-full">
                  <SelectValue placeholder="בחר/י" />
                </SelectTrigger>
                <SelectContent>
                  {skills.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name_he}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {state?.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "שומר/ת..." : "הוספת שאלה"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
