import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient, isAiConfigured, AI_MODEL, AI_EFFORT, AI_MAX_TOKENS } from "@/lib/ai/client";
import { analyzeStudentOutputSchema, type AnalyzeStudentOutput, type AiUnavailable } from "@/lib/ai/schemas";
import { buildAnalyzeStudentPrompt, type AnalyzeStudentInput } from "@/lib/ai/prompts/analyze-student";

const FALLBACK_MESSAGE = "ניתוח ה-AI אינו זמין כרגע. אפשר להיעזר במדדים שלמעלה כדי לבחור מיומנות לתרגול.";

/**
 * מנתח את פרופיל המיומנויות של תלמיד/ה ומייצר המלצת תרגול קונקרטית למורה
 * (סעיף 9 במפרט - מנוע ההתאמה האישית; סעיף 6 - "המלצת AI" בפרופיל הקורא).
 */
export async function analyzeStudent(
  input: AnalyzeStudentInput
): Promise<AnalyzeStudentOutput | AiUnavailable> {
  if (!isAiConfigured()) {
    return { unavailable: true, message: FALLBACK_MESSAGE };
  }

  if (input.skills.length === 0) {
    return {
      unavailable: true,
      message: "עדיין אין מספיק נתוני קריאה כדי לייצר המלצה מותאמת אישית.",
    };
  }

  const { system, user } = buildAnalyzeStudentPrompt(input);

  try {
    const client = getAnthropicClient();
    const message = await client.messages.parse({
      model: AI_MODEL,
      max_tokens: AI_MAX_TOKENS,
      system,
      messages: [{ role: "user", content: user }],
      output_config: {
        effort: AI_EFFORT,
        format: zodOutputFormat(analyzeStudentOutputSchema),
      },
    });

    if (message.stop_reason === "refusal" || !message.parsed_output) {
      console.error("analyzeStudent: AI refused or returned no parsed output", message.stop_reason);
      return { unavailable: true, message: FALLBACK_MESSAGE };
    }

    return message.parsed_output;
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      console.error("analyzeStudent: rate limited", error.message);
    } else if (error instanceof Anthropic.APIConnectionError) {
      console.error("analyzeStudent: connection error", error.message);
    } else if (error instanceof Anthropic.APIError) {
      console.error(`analyzeStudent: API error ${error.status}`, error.message);
    } else {
      console.error("analyzeStudent: unexpected error", error);
    }
    return { unavailable: true, message: FALLBACK_MESSAGE };
  }
}
