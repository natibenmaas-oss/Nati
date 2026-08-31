"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClassSchema } from "@/lib/validation/classes";

export interface ClassActionState {
  error?: string;
  success?: boolean;
}

export async function createClassAction(
  _prevState: ClassActionState,
  formData: FormData
): Promise<ClassActionState> {
  const parsed = createClassSchema.safeParse({
    name: formData.get("name"),
    grade_level: formData.get("grade_level"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "יש להתחבר מחדש" };
  }

  const { error } = await supabase.from("classes").insert({
    teacher_id: user.id,
    name: parsed.data.name,
    grade_level: parsed.data.grade_level,
  });

  if (error) {
    return { error: "יצירת הכיתה נכשלה. נסה/י שוב." };
  }

  revalidatePath("/teacher/classes");
  revalidatePath("/teacher/dashboard");
  return { success: true };
}
