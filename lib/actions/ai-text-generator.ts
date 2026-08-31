"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateTextWithQuestions } from "@/lib/ai/generateText";
import { generateTextFormSchema } from "@/lib/validation/generate-text";
import type { GenerateTextWithQuestionsOutput } from "@/lib/ai/schemas";
import type { TextDifficulty } from "@/types/database";

export interface GenerateTextActionState {
  error?: string;
  draft?: GenerateTextWithQuestionsOutput;
  meta?: { gradeLevel: string; genre: string; difficulty: TextDifficulty; purposeSkillId: string };
}

export async function generateTextAction(
  _prevState: GenerateTextActionState,
  formData: FormData
): Promise<GenerateTextActionState> {
  const parsed = generateTextFormSchema.safeParse({
    gradeLevel: formData.get("gradeLevel"),
    topic: formData.get("topic"),
    genre: formData.get("genre"),
    approxWordCount: formData.get("approxWordCount"),
    difficulty: formData.get("difficulty"),
    purposeSkillId: formData.get("purposeSkillId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  }

  const supabase = await createClient();
  const { data: skill } = await supabase
    .from("skills")
    .select("name_he")
    .eq("id", parsed.data.purposeSkillId)
    .maybeSingle();

  const result = await generateTextWithQuestions({
    gradeLevel: parsed.data.gradeLevel,
    topic: parsed.data.topic,
    genre: parsed.data.genre,
    approxWordCount: parsed.data.approxWordCount,
    difficulty: parsed.data.difficulty,
    purposeSkillName: skill?.name_he ?? "הבנת הנקרא",
  });

  if ("unavailable" in result) {
    return { error: result.message };
  }

  return {
    draft: result,
    meta: {
      gradeLevel: parsed.data.gradeLevel,
      genre: parsed.data.genre,
      difficulty: parsed.data.difficulty,
      purposeSkillId: parsed.data.purposeSkillId,
    },
  };
}

export interface SaveGeneratedTextState {
  error?: string;
}

export async function saveGeneratedTextAction(
  draft: GenerateTextWithQuestionsOutput,
  meta: { gradeLevel: string; genre: string; difficulty: TextDifficulty; purposeSkillId: string }
): Promise<SaveGeneratedTextState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "יש להתחבר מחדש" };

  const estimatedReadingTime = Math.max(2, Math.round(draft.content.trim().split(/\s+/).length / 90));

  const { data: text, error } = await supabase
    .from("texts")
    .insert({
      title: draft.title,
      content: draft.content,
      grade_level: meta.gradeLevel,
      difficulty: meta.difficulty,
      genre: meta.genre,
      estimated_reading_time: estimatedReadingTime,
      vocabulary_level: "בינוני",
      cover_icon: draft.cover_icon || "📖",
      tags: [],
      created_by: user.id,
      is_ai_generated: true,
      generation_purpose_skill_id: meta.purposeSkillId,
    })
    .select("id")
    .single();

  if (error || !text) return { error: "שמירת הטקסט נכשלה" };

  if (draft.vocabulary_words.length > 0) {
    await supabase.from("vocabulary_words").insert(
      draft.vocabulary_words.map((v) => ({ text_id: text.id, word: v.word, definition: v.definition }))
    );
  }

  const { data: skills } = await supabase.from("skills").select("id, key");
  const skillIdByKey = new Map<string, string>((skills ?? []).map((s) => [s.key, s.id]));

  if (draft.questions.length > 0) {
    await supabase.from("questions").insert(
      draft.questions.map((q, i) => {
        const isMcq = q.type === "mcq" && q.options && q.options.length >= 2;
        return {
          text_id: text.id,
          skill_id: skillIdByKey.get(q.skill_key) ?? null,
          type: q.type,
          question_text: q.question_text,
          options: isMcq
            ? q.options!.map((o, idx) => ({ key: String(idx + 1), label: o.label }))
            : null,
          correct_answer: isMcq
            ? String((q.correct_option_index ?? 0) + 1)
            : (q.reference_answer ?? null),
          difficulty: meta.difficulty,
          order_index: i,
        };
      })
    );
  }

  redirect(`/teacher/texts/${text.id}`);
}
