import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient, isAiConfigured, AI_MODEL, AI_EFFORT, AI_MAX_TOKENS } from "@/lib/ai/client";
import { weeklyReportOutputSchema, type WeeklyReportOutput, type AiUnavailable } from "@/lib/ai/schemas";
import { buildWeeklyReportPrompt } from "@/lib/ai/prompts/weekly-report";
import type { WeeklyClassStats } from "@/lib/scoring/class-weekly-stats";

const FALLBACK_MESSAGE = "סיכום ה-AI אינו זמין כרגע. אפשר להיעזר בנתונים המספריים שלמעלה.";

/** מנסח סיכום שבועי בעברית לכיתה (סעיף 20 במפרט), על סמך סטטיסטיקות שכבר חושבו בכללים. */
export async function generateWeeklyReport(
  stats: WeeklyClassStats
): Promise<WeeklyReportOutput | AiUnavailable> {
  if (!isAiConfigured()) {
    return { unavailable: true, message: FALLBACK_MESSAGE };
  }

  const { system, user } = buildWeeklyReportPrompt(stats);

  try {
    const client = getAnthropicClient();
    const message = await client.messages.parse({
      model: AI_MODEL,
      max_tokens: AI_MAX_TOKENS,
      system,
      messages: [{ role: "user", content: user }],
      output_config: {
        effort: AI_EFFORT,
        format: zodOutputFormat(weeklyReportOutputSchema),
      },
    });

    if (message.stop_reason === "refusal" || !message.parsed_output) {
      console.error("generateWeeklyReport: AI refused or returned no parsed output", message.stop_reason);
      return { unavailable: true, message: FALLBACK_MESSAGE };
    }

    return message.parsed_output;
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      console.error("generateWeeklyReport: rate limited", error.message);
    } else if (error instanceof Anthropic.APIConnectionError) {
      console.error("generateWeeklyReport: connection error", error.message);
    } else if (error instanceof Anthropic.APIError) {
      console.error(`generateWeeklyReport: API error ${error.status}`, error.message);
    } else {
      console.error("generateWeeklyReport: unexpected error", error);
    }
    return { unavailable: true, message: FALLBACK_MESSAGE };
  }
}
