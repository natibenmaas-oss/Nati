"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recomputeStudentSkillScores } from "@/lib/scoring/skill-scores";
import { evaluateAnswer } from "@/lib/ai/evaluateAnswer";
import { generateHint } from "@/lib/ai/generateHint";
import type { ReadingMode } from "@/types/database";

export interface AssignmentContext {
  assignmentId: string;
  textId: string;
  classId: string;
  title: string;
}

/** מאמת שהתלמיד המחובר רשאי לגשת למשימה (ה-RLS יחסום ממילא אם לא) ומחזיר את הפרטים הבסיסיים */
export async function getAssignmentContext(assignmentId: string): Promise<AssignmentContext | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assignments")
    .select("id, text_id, class_id, title")
    .eq("id", assignmentId)
    .maybeSingle();
  if (!data) return null;
  return { assignmentId: data.id, textId: data.text_id, classId: data.class_id, title: data.title };
}

/** מחזיר את מפגש הקריאה הפעיל (in_progress) הנוכחי של התלמיד עבור המשימה, אם קיים */
export async function getActiveSession(assignmentId: string, textId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("reading_sessions")
    .select("*")
    .eq("student_id", user.id)
    .eq("assignment_id", assignmentId)
    .eq("text_id", textId)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

export async function startReadingSession(
  assignmentId: string,
  textId: string,
  mode: ReadingMode
): Promise<{ sessionId: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "יש להתחבר מחדש" };

  const existing = await getActiveSession(assignmentId, textId);
  if (existing && existing.status === "in_progress") {
    return { sessionId: existing.id };
  }

  const { data: session, error } = await supabase
    .from("reading_sessions")
    .insert({ student_id: user.id, text_id: textId, assignment_id: assignmentId, reading_mode: mode })
    .select("id")
    .single();

  if (error || !session) return { error: "לא הצלחנו להתחיל את משימת הקריאה. נסה/י שוב." };

  await supabase.from("assignment_submissions").upsert(
    { assignment_id: assignmentId, student_id: user.id, session_id: session.id, status: "in_progress" },
    { onConflict: "assignment_id,student_id" }
  );

  return { sessionId: session.id };
}

export interface FinishReadingMetrics {
  durationSeconds: number;
  wpmEstimated: number | null;
  // המדדים הבאים קיימים רק במצב "קריאה בקול" וכאשר הדפדפן תומך ב-Web Speech API
  recognizedWordCount?: number | null;
  pauseCount?: number | null;
  recognizedAccuracy?: number | null;
}

export async function finishReadingStep(sessionId: string, metrics: FinishReadingMetrics) {
  const supabase = await createClient();
  await supabase
    .from("reading_sessions")
    .update({
      duration_seconds: metrics.durationSeconds,
      wpm_estimated: metrics.wpmEstimated,
      is_estimated: true,
      recognized_word_count: metrics.recognizedWordCount ?? null,
      pause_count: metrics.pauseCount ?? null,
      recognized_accuracy: metrics.recognizedAccuracy ?? null,
    })
    .eq("id", sessionId);
}

export interface AnswerInput {
  questionId: string;
  answer: string;
}

export interface QuestionResult {
  isCorrect: boolean | null;
  score: number | null;
  feedback: string | null;
  hintsUsed: number;
}

async function getSessionTextContext(sessionId: string) {
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("reading_sessions")
    .select("text_id")
    .eq("id", sessionId)
    .single();
  if (!session) return null;

  const { data: text } = await supabase
    .from("texts")
    .select("content, grade_level")
    .eq("id", session.text_id)
    .single();
  if (!text) return null;

  return { textContent: text.content, gradeLevel: text.grade_level };
}

/**
 * שומר תשובות לשאלות (שלב 3 או 4) ומעריך אותן מיידית: MCQ בכללים (לא AI),
 * שאלות פתוחות דרך lib/ai/evaluateAnswer. אם ה-AI אינו זמין, השאלה הפתוחה
 * נשמרת עם is_correct=null (ממתין לבדיקה) בלי לחסום את המשך התהליך (סעיף 26).
 */
export async function submitAndEvaluateAnswers(
  sessionId: string,
  answers: AnswerInput[]
): Promise<Record<string, QuestionResult>> {
  const supabase = await createClient();

  const questionIds = answers.map((a) => a.questionId);
  const [{ data: questions }, context] = await Promise.all([
    supabase.from("questions").select("id, type, question_text, correct_answer").in("id", questionIds),
    getSessionTextContext(sessionId),
  ]);
  const questionById = new Map((questions ?? []).map((q) => [q.id, q]));

  const evaluated = await Promise.all(
    answers.map(async ({ questionId, answer }) => {
      const question = questionById.get(questionId);
      const isMcq = question?.type === "mcq";

      if (isMcq || !context) {
        const isCorrect = isMcq ? answer === question?.correct_answer : null;
        return {
          questionId,
          row: { session_id: sessionId, question_id: questionId, student_answer: answer, is_correct: isCorrect },
          result: {
            isCorrect,
            score: isCorrect === null ? null : isCorrect ? 100 : 0,
            feedback: isCorrect === null ? null : isCorrect ? "תשובה נכונה! כל הכבוד 🎉" : "לא בדיוק - רוצה לנסות שוב?",
            hintsUsed: 0,
          } satisfies QuestionResult,
        };
      }

      const aiResult = await evaluateAnswer({
        textContent: context.textContent,
        questionText: question?.question_text ?? "",
        questionType: question?.type ?? "explicit",
        referenceAnswer: question?.correct_answer ?? null,
        studentAnswer: answer,
        studentGradeLevel: context.gradeLevel,
      });

      if ("unavailable" in aiResult) {
        return {
          questionId,
          row: { session_id: sessionId, question_id: questionId, student_answer: answer, is_correct: null },
          result: { isCorrect: null, score: null, feedback: aiResult.message, hintsUsed: 0 } satisfies QuestionResult,
        };
      }

      return {
        questionId,
        row: {
          session_id: sessionId,
          question_id: questionId,
          student_answer: answer,
          is_correct: aiResult.correct,
          ai_score: aiResult.score,
          ai_feedback: aiResult,
        },
        result: {
          isCorrect: aiResult.correct,
          score: aiResult.score,
          feedback: aiResult.feedback,
          hintsUsed: 0,
        } satisfies QuestionResult,
      };
    })
  );

  await supabase.from("answers").upsert(
    evaluated.map((e) => e.row),
    { onConflict: "session_id,question_id" }
  );

  return Object.fromEntries(evaluated.map((e) => [e.questionId, e.result]));
}

/** מבקש רמז לשאלה (סעיף 14 במפרט). מדרג את הרמז לפי כמות הרמזים שכבר ניתנו לשאלה הזו. */
export async function requestHint(
  sessionId: string,
  questionId: string,
  currentAnswer: string
): Promise<{ hint: string; isFinalExplanation: boolean; hintsUsed: number }> {
  const supabase = await createClient();

  const [{ data: existingAnswer }, { data: question }, context] = await Promise.all([
    supabase.from("answers").select("hints_used").eq("session_id", sessionId).eq("question_id", questionId).maybeSingle(),
    supabase.from("questions").select("question_text").eq("id", questionId).single(),
    getSessionTextContext(sessionId),
  ]);

  const hintsUsedSoFar = existingAnswer?.hints_used ?? 0;
  const hintLevel = Math.min(hintsUsedSoFar + 1, 3) as 1 | 2 | 3;

  const hintResult = await generateHint({
    textContent: context?.textContent ?? "",
    questionText: question?.question_text ?? "",
    studentAnswer: currentAnswer,
    hintLevel,
    studentGradeLevel: context?.gradeLevel ?? "יסודי",
  });

  await supabase.from("answers").upsert(
    {
      session_id: sessionId,
      question_id: questionId,
      student_answer: currentAnswer,
      hints_used: hintsUsedSoFar + 1,
    },
    { onConflict: "session_id,question_id" }
  );

  return { hint: hintResult.hint, isFinalExplanation: hintResult.is_final_explanation, hintsUsed: hintsUsedSoFar + 1 };
}

/** שולח מחדש תשובה יחידה (אחרי רמז), ומעריך אותה מחדש */
export async function resubmitAnswer(
  sessionId: string,
  questionId: string,
  newAnswer: string
): Promise<QuestionResult> {
  const results = await submitAndEvaluateAnswers(sessionId, [{ questionId, answer: newAnswer }]);
  const supabase = await createClient();
  const { data: existingAnswer } = await supabase
    .from("answers")
    .select("attempt_number, hints_used")
    .eq("session_id", sessionId)
    .eq("question_id", questionId)
    .maybeSingle();
  await supabase
    .from("answers")
    .update({ attempt_number: (existingAnswer?.attempt_number ?? 1) + 1 })
    .eq("session_id", sessionId)
    .eq("question_id", questionId);

  return { ...results[questionId], hintsUsed: existingAnswer?.hints_used ?? 0 };
}

export async function submitReflection(sessionId: string, reflectionText: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: session } = await supabase
    .from("reading_sessions")
    .update({
      reflection_text: reflectionText,
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .select("assignment_id")
    .single();

  // ציון המשימה מחושב מתוך כל התשובות שכבר נבדקו - הן MCQ (בכללים) והן שאלות
  // פתוחות שהוערכו ע"י lib/ai/evaluateAnswer בשלב submitAndEvaluateAnswers
  const { data: sessionAnswers } = await supabase
    .from("answers")
    .select("is_correct")
    .eq("session_id", sessionId);
  const graded = (sessionAnswers ?? []).filter((a) => a.is_correct !== null);
  const score =
    graded.length > 0
      ? Math.round((graded.filter((a) => a.is_correct).length / graded.length) * 100)
      : null;

  if (session?.assignment_id) {
    await supabase
      .from("assignment_submissions")
      .update({ status: "completed", submitted_at: new Date().toISOString(), score })
      .eq("assignment_id", session.assignment_id)
      .eq("student_id", user.id);
    revalidatePath("/student/dashboard");
    revalidatePath("/teacher/assignments");
  }

  await recomputeStudentSkillScores(user.id);
  revalidatePath(`/teacher/students/${user.id}`);
  revalidatePath("/teacher/dashboard");
}
