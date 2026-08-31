"use server";

import { createClient } from "@/lib/supabase/server";
import { getTeacherDashboardData } from "@/lib/scoring/dashboard";
import { askAssistant, type ChatTurn } from "@/lib/ai/chat";
import { buildTeacherAssistantSystemPrompt, toApiHistory } from "@/lib/ai/prompts/teacher-assistant";

export interface AssistantReply {
  text?: string;
  error?: string;
}

export async function askTeacherAssistantAction(history: ChatTurn[], message: string): Promise<AssistantReply> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "יש להתחבר מחדש" };

  const dashboard = await getTeacherDashboardData(user.id);
  const system = buildTeacherAssistantSystemPrompt(dashboard);

  const result = await askAssistant(system, toApiHistory(history), message);
  if ("unavailable" in result) return { error: result.message };
  return { text: result.text };
}
