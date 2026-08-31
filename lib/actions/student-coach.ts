"use server";

import { createClient } from "@/lib/supabase/server";
import { getStudentProfileData } from "@/lib/scoring/student-profile";
import { askAssistant, type ChatTurn } from "@/lib/ai/chat";
import { buildStudentCoachSystemPrompt } from "@/lib/ai/prompts/student-coach";

export interface CoachReply {
  text?: string;
  error?: string;
}

export async function askStudentCoachAction(history: ChatTurn[], message: string): Promise<CoachReply> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "יש להתחבר מחדש" };

  const [{ data: profile }, { strengths, weaknesses }, { data: recentSession }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    getStudentProfileData(user.id),
    supabase
      .from("reading_sessions")
      .select("text_id")
      .eq("student_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  let recentTextTitle: string | null = null;
  if (recentSession?.text_id) {
    const { data: text } = await supabase.from("texts").select("title").eq("id", recentSession.text_id).maybeSingle();
    recentTextTitle = text?.title ?? null;
  }

  const system = buildStudentCoachSystemPrompt({
    firstName: profile?.full_name?.split(" ")[0] ?? "חבר/ה",
    strengths,
    weaknesses,
    recentTextTitle,
  });

  const result = await askAssistant(system, history.slice(-10), message);
  if ("unavailable" in result) return { error: result.message };
  return { text: result.text };
}
