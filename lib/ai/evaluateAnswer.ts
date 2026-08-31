import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient, isAiConfigured, AI_MODEL, AI_EFFORT, AI_MAX_TOKENS } from "@/lib/ai/client";
import { evaluateAnswerOutputSchema, type EvaluateAnswerOutput, type AiUnavailable } from "@/lib/ai/schemas";
import { buildEvaluateAnswerPrompt, type EvaluateAnswerInput } from "@/lib/ai/prompts/evaluate-answer";

const FALLBACK_MESSAGE = "בדיקת התשובה האוטומטית אינה זמינה כרגע. התשובה נשמרה ותיבדק בהמשך.";

/**
 * מעריך תשובה פתוחה של תלמיד/ה לשאלת הבנת הנקרא (סעיף 13 במפרט).
 * לעולם לא זורק - במקרה של כשל (אין מפתח, rate limit, timeout, refusal) מחזיר
 * אובייקט { unavailable: true } כדי שהקורא ימשיך לעבוד בלי AI (סעיף 26 במפרט).
 */
export async function evaluateAnswer(
  input: EvaluateAnswerInput
): Promise<EvaluateAnswerOutput | AiUnavailable> {
  if (!isAiConfigured()) {
    return { unavailable: true, message: FALLBACK_MESSAGE };
  }

  const { system, user } = buildEvaluateAnswerPrompt(input);

  try {
    const client = getAnthropicClient();
    const message = await client.messages.parse({
      model: AI_MODEL,
      max_tokens: AI_MAX_TOKENS,
      system,
      messages: [{ role: "user", content: user }],
      output_config: {
        effort: AI_EFFORT,
        format: zodOutputFormat(evaluateAnswerOutputSchema),
      },
    });

    if (message.stop_reason === "refusal" || !message.parsed_output) {
      console.error("evaluateAnswer: AI refused or returned no parsed output", message.stop_reason);
      return { unavailable: true, message: FALLBACK_MESSAGE };
    }

    return message.parsed_output;
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      console.error("evaluateAnswer: rate limited", error.message);
    } else if (error instanceof Anthropic.APIConnectionError) {
      console.error("evaluateAnswer: connection error", error.message);
    } else if (error instanceof Anthropic.APIError) {
      console.error(`evaluateAnswer: API error ${error.status}`, error.message);
    } else {
      console.error("evaluateAnswer: unexpected error", error);
    }
    return { unavailable: true, message: FALLBACK_MESSAGE };
  }
}
