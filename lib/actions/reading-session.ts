"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recomputeStudentSkillScores } from "@/lib/scoring/skill-scores";
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

export async function finishReadingStep(
  sessionId: string,
  durationSeconds: number,
  wpmEstimated: number | null
) {
  const supabase = await createClient();
  await supabase
    .from("reading_sessions")
    .update({ duration_seconds: durationSeconds, wpm_estimated: wpmEstimated, is_estimated: true })
    .eq("id", sessionId);
}

export interface AnswerInput {
  questionId: string;
  answer: string;
}

/**
 * שומר תשובות לשאלות (שלב 3 או 4). שאלות MCQ נבדקות מיידית בכללים (לא AI).
 * שאלות פתוחות נשמרות עם is_correct=null/ai_score=null עד שיעברו הערכת AI (שלב הבא).
 */
export async function submitAnswers(sessionId: string, answers: AnswerInput[]) {
  const supabase = await createClient();

  const questionIds = answers.map((a) => a.questionId);
  const { data: questions } = await supabase
    .from("questions")
    .select("id, type, correct_answer")
    .in("id", questionIds);
  const questionById = new Map((questions ?? []).map((q) => [q.id, q]));

  const rows = answers.map(({ questionId, answer }) => {
    const question = questionById.get(questionId);
    const isMcq = question?.type === "mcq";
    return {
      session_id: sessionId,
      question_id: questionId,
      student_answer: answer,
      is_correct: isMcq ? answer === question?.correct_answer : null,
    };
  });

  await supabase.from("answers").upsert(rows, { onConflict: "session_id,question_id" });
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

  // ציון המשימה מחושב מתוך התשובות שכבר נבדקו (MCQ) - תשובות פתוחות יתווספו
  // לחישוב אוטומטית לאחר הערכת ה-AI (lib/ai/evaluateAnswer, שלב הבא בפיתוח)
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
