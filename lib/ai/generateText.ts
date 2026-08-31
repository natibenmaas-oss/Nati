import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient, isAiConfigured, AI_MODEL } from "@/lib/ai/client";
import {
  generateTextWithQuestionsOutputSchema,
  type GenerateTextWithQuestionsOutput,
  type AiUnavailable,
} from "@/lib/ai/schemas";
import { buildGenerateTextPrompt, type GenerateTextInput } from "@/lib/ai/prompts/generate-text";

const FALLBACK_MESSAGE = "יצירת הטקסט באמצעות AI אינה זמינה כרגע. אפשר להוסיף טקסט באופן ידני בינתיים.";

// טקסט + לפחות 5 שאלות + מילון הוא פלט ארוך יחסית לשאר קריאות ה-AI במערכת,
// ודורש הקפדה על אילוצי הטמעה (שאלות מבוססות טקסט) - effort גבוה יותר.
const GENERATE_TEXT_EFFORT = "high" as const;
const GENERATE_TEXT_MAX_TOKENS = 4096;

/** יוצר טקסט מקורי + שאלות נלוות בבת אחת (סעיף 8 במפרט - AI Text Generator). */
export async function generateTextWithQuestions(
  input: GenerateTextInput
): Promise<GenerateTextWithQuestionsOutput | AiUnavailable> {
  if (!isAiConfigured()) {
    return { unavailable: true, message: FALLBACK_MESSAGE };
  }

  const { system, user } = buildGenerateTextPrompt(input);

  try {
    const client = getAnthropicClient();
    const message = await client.messages.parse({
      model: AI_MODEL,
      max_tokens: GENERATE_TEXT_MAX_TOKENS,
      system,
      messages: [{ role: "user", content: user }],
      output_config: {
        effort: GENERATE_TEXT_EFFORT,
        format: zodOutputFormat(generateTextWithQuestionsOutputSchema),
      },
    });

    if (message.stop_reason === "refusal" || !message.parsed_output) {
      console.error("generateTextWithQuestions: AI refused or returned no parsed output", message.stop_reason);
      return { unavailable: true, message: FALLBACK_MESSAGE };
    }

    return message.parsed_output;
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      console.error("generateTextWithQuestions: rate limited", error.message);
    } else if (error instanceof Anthropic.APIConnectionError) {
      console.error("generateTextWithQuestions: connection error", error.message);
    } else if (error instanceof Anthropic.APIError) {
      console.error(`generateTextWithQuestions: API error ${error.status}`, error.message);
    } else {
      console.error("generateTextWithQuestions: unexpected error", error);
    }
    return { unavailable: true, message: FALLBACK_MESSAGE };
  }
}
