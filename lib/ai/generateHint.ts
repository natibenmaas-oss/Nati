import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient, isAiConfigured, AI_MODEL, AI_EFFORT, AI_MAX_TOKENS } from "@/lib/ai/client";
import { generateHintOutputSchema, type GenerateHintOutput } from "@/lib/ai/schemas";
import { buildGenerateHintPrompt, type GenerateHintInput } from "@/lib/ai/prompts/generate-hint";

// רמזים גנריים לשימוש כש-AI לא זמין (סעיף 26 במפרט) - עדיף רמז כללי מאשר כלום.
// לכן, בשונה מ-evaluateAnswer, generateHint לעולם לא מחזיר "unavailable" ריק -
// תמיד יש רמז כלשהו להציג לתלמיד/ה.
const GENERIC_HINTS: Record<1 | 2 | 3, string> = {
  1: "נסה/י לקרוא שוב את הפסקה הרלוונטית בטקסט - התשובה מסתתרת שם.",
  2: "חפש/י בטקסט מילים שקשורות ישירות לשאלה - הן יכוונו אותך לתשובה.",
  3: "נסה/י לחשוב מה הטקסט אומר במפורש, ולא רק מה שנראה לך הגיוני מבחוץ.",
};

/**
 * מייצר רמז מדורג לתלמיד/ה שמתקשה/ה בשאלה (סעיף 14 במפרט - למידה באמצעות רמזים).
 * גם כאן: לעולם לא זורק, ותמיד יש רמז גנרי לחזור אליו אם ה-AI לא זמין.
 */
export async function generateHint(input: GenerateHintInput): Promise<GenerateHintOutput> {
  if (!isAiConfigured()) {
    return {
      hint: GENERIC_HINTS[input.hintLevel],
      is_final_explanation: false,
    };
  }

  const { system, user } = buildGenerateHintPrompt(input);

  try {
    const client = getAnthropicClient();
    const message = await client.messages.parse({
      model: AI_MODEL,
      max_tokens: AI_MAX_TOKENS,
      system,
      messages: [{ role: "user", content: user }],
      output_config: {
        effort: AI_EFFORT,
        format: zodOutputFormat(generateHintOutputSchema),
      },
    });

    if (message.stop_reason === "refusal" || !message.parsed_output) {
      console.error("generateHint: AI refused or returned no parsed output", message.stop_reason);
      return { hint: GENERIC_HINTS[input.hintLevel], is_final_explanation: false };
    }

    return message.parsed_output;
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      console.error("generateHint: rate limited", error.message);
    } else if (error instanceof Anthropic.APIConnectionError) {
      console.error("generateHint: connection error", error.message);
    } else if (error instanceof Anthropic.APIError) {
      console.error(`generateHint: API error ${error.status}`, error.message);
    } else {
      console.error("generateHint: unexpected error", error);
    }
    return { hint: GENERIC_HINTS[input.hintLevel], is_final_explanation: false };
  }
}
