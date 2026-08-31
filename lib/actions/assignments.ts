"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAssignmentSchema } from "@/lib/validation/assignments";

export interface AssignmentActionState {
  error?: string;
}

export async function createAssignmentAction(
  _prevState: AssignmentActionState,
  formData: FormData
): Promise<AssignmentActionState> {
  const parsed = createAssignmentSchema.safeParse({
    class_id: formData.get("class_id"),
    text_id: formData.get("text_id"),
    title: formData.get("title"),
    instructions: formData.get("instructions") || undefined,
    skill_focus: formData.getAll("skill_focus"),
    due_date: formData.get("due_date") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "יש להתחבר מחדש" };

  const { data: klass } = await supabase
    .from("classes")
    .select("id")
    .eq("id", parsed.data.class_id)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!klass) return { error: "הכיתה לא נמצאה" };

  const { error } = await supabase.from("assignments").insert({
    teacher_id: user.id,
    class_id: parsed.data.class_id,
    text_id: parsed.data.text_id,
    title: parsed.data.title,
    instructions: parsed.data.instructions ?? null,
    skill_focus: parsed.data.skill_focus,
    due_date: parsed.data.due_date ?? null,
  });

  if (error) return { error: "יצירת המשימה נכשלה" };

  revalidatePath("/teacher/assignments");
  revalidatePath("/teacher/dashboard");
  redirect("/teacher/assignments");
}
