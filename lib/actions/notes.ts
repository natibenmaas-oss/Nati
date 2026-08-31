"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const noteSchema = z.object({
  student_id: z.string().uuid(),
  note_text: z.string().trim().min(1, "אי אפשר לשמור הערה ריקה"),
});

export interface NoteActionState {
  error?: string;
  success?: boolean;
}

export async function addTeacherNoteAction(
  _prevState: NoteActionState,
  formData: FormData
): Promise<NoteActionState> {
  const parsed = noteSchema.safeParse({
    student_id: formData.get("student_id"),
    note_text: formData.get("note_text"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "יש להתחבר מחדש" };

  const { error } = await supabase.from("teacher_notes").insert({
    teacher_id: user.id,
    student_id: parsed.data.student_id,
    note_text: parsed.data.note_text,
  });

  if (error) return { error: "שמירת ההערה נכשלה" };

  revalidatePath(`/teacher/students/${parsed.data.student_id}`);
  return { success: true };
}
