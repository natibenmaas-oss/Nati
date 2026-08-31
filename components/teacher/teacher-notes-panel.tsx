"use client";

import { useActionState, useRef, useEffect } from "react";
import { addTeacherNoteAction, type NoteActionState } from "@/lib/actions/notes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote } from "lucide-react";

const initialState: NoteActionState = {};

export interface TeacherNote {
  id: string;
  note_text: string;
  created_at: string;
}

export function TeacherNotesPanel({ studentId, notes }: { studentId: string; notes: TeacherNote[] }) {
  const [state, formAction, isPending] = useActionState(addTeacherNoteAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <div className="flex flex-col gap-4">
      <form ref={formRef} action={formAction} className="flex flex-col gap-2">
        <input type="hidden" name="student_id" value={studentId} />
        <Textarea
          name="note_text"
          placeholder="הוסף/י הערה פרטית על התלמיד/ה (רק את/ה תראה אותה)..."
          rows={2}
          required
        />
        {state?.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
        <Button type="submit" size="sm" className="self-end" disabled={isPending}>
          {isPending ? "שומר/ת..." : "שמירת הערה"}
        </Button>
      </form>

      {notes.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <StickyNote className="size-4" aria-hidden />
          אין עדיין הערות
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p>{n.note_text}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(n.created_at).toLocaleDateString("he-IL")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
