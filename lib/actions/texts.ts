"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createTextSchema } from "@/lib/validation/texts";

export interface TextActionState {
  error?: string;
}

export async function createTextAction(
  _prevState: TextActionState,
  formData: FormData
): Promise<TextActionState> {
  const parsed = createTextSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    grade_level: formData.get("grade_level"),
    difficulty: formData.get("difficulty"),
    genre: formData.get("genre"),
    estimated_reading_time: formData.get("estimated_reading_time"),
    vocabulary_level: formData.get("vocabulary_level"),
    cover_icon: formData.get("cover_icon") || "📖",
    tags: formData.get("tags") ?? "",
    vocab_word_1: formData.get("vocab_word_1") ?? "",
    vocab_definition_1: formData.get("vocab_definition_1") ?? "",
    vocab_word_2: formData.get("vocab_word_2") ?? "",
    vocab_definition_2: formData.get("vocab_definition_2") ?? "",
    vocab_word_3: formData.get("vocab_word_3") ?? "",
    vocab_definition_3: formData.get("vocab_definition_3") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "יש להתחבר מחדש" };

  const {
    vocab_word_1,
    vocab_definition_1,
    vocab_word_2,
    vocab_definition_2,
    vocab_word_3,
    vocab_definition_3,
    ...text
  } = parsed.data;

  const { data: created, error } = await supabase
    .from("texts")
    .insert({ ...text, created_by: user.id, is_ai_generated: false })
    .select("id")
    .single();

  if (error || !created) {
    return { error: "יצירת הטקסט נכשלה. נסה/י שוב." };
  }

  const vocabRows = [
    vocab_word_1 && vocab_definition_1
      ? { text_id: created.id, word: vocab_word_1, definition: vocab_definition_1 }
      : null,
    vocab_word_2 && vocab_definition_2
      ? { text_id: created.id, word: vocab_word_2, definition: vocab_definition_2 }
      : null,
    vocab_word_3 && vocab_definition_3
      ? { text_id: created.id, word: vocab_word_3, definition: vocab_definition_3 }
      : null,
  ].filter((r): r is { text_id: string; word: string; definition: string } => r !== null);

  if (vocabRows.length > 0) {
    await supabase.from("vocabulary_words").insert(vocabRows);
  }

  revalidatePath("/teacher/texts");
  redirect(`/teacher/texts/${created.id}`);
}
