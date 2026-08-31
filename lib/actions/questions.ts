"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createQuestionSchema } from "@/lib/validation/questions";

export interface QuestionActionState {
  error?: string;
  success?: boolean;
}

export async function createQuestionAction(
  _prevState: QuestionActionState,
  formData: FormData
): Promise<QuestionActionState> {
  const type = formData.get("type") as string;

  let options: { key: string; label: string }[] | undefined;
  let correctAnswer = (formData.get("correct_answer") as string | null)?.trim() || undefined;

  if (type === "mcq") {
    const rawOptions = [1, 2, 3, 4]
      .map((i) => (formData.get(`option_${i}`) as string | null)?.trim())
      .filter((v): v is string => !!v);
    options = rawOptions.map((label, i) => ({ key: String(i + 1), label }));
    const correctIndex = formData.get("correct_option") as string | null;
    correctAnswer = correctIndex ?? undefined;
  }

  const parsed = createQuestionSchema.safeParse({
    text_id: formData.get("text_id"),
    skill_id: formData.get("skill_id") || "",
    type,
    question_text: formData.get("question_text"),
    difficulty: formData.get("difficulty"),
    correct_answer: correctAnswer,
    options,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "יש להתחבר מחדש" };

  // ודא בעלות על הטקסט (ה-RLS יחסום ממילא, אבל עדיף הודעה ברורה)
  const { data: text } = await supabase
    .from("texts")
    .select("id")
    .eq("id", parsed.data.text_id)
    .eq("created_by", user.id)
    .maybeSingle();
  if (!text) return { error: "רק היוצר/ת של הטקסט יכול/ה להוסיף לו שאלות" };

  const { error } = await supabase.from("questions").insert({
    text_id: parsed.data.text_id,
    skill_id: parsed.data.skill_id || null,
    type: parsed.data.type,
    question_text: parsed.data.question_text,
    difficulty: parsed.data.difficulty,
    correct_answer: parsed.data.correct_answer ?? null,
    options: parsed.data.options ?? null,
  });

  if (error) return { error: "יצירת השאלה נכשלה" };

  revalidatePath(`/teacher/texts/${parsed.data.text_id}`);
  return { success: true };
}

export async function deleteQuestionAction(questionId: string, textId: string) {
  const supabase = await createClient();
  await supabase.from("questions").delete().eq("id", questionId);
  revalidatePath(`/teacher/texts/${textId}`);
}
