import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, isAiConfigured, AI_MODEL, AI_MAX_TOKENS } from "@/lib/ai/client";
import type { AiUnavailable } from "@/lib/ai/schemas";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const CHAT_EFFORT = "medium" as const;

/**
 * שיחת AI חופשית (לא JSON מובנה) - משמש הן לעוזר ה-AI של המורה (סעיף 19)
 * והן למאמן הקריאה של התלמיד (סעיף 18). ה-system prompt של כל אחד קובע
 * את ההתנהגות; זו רק שכבת התקשורת המשותפת עם Claude.
 */
export async function askAssistant(
  system: string,
  history: ChatTurn[],
  userMessage: string
): Promise<{ text: string } | AiUnavailable> {
  const fallback = { unavailable: true as const, message: "העוזר אינו זמין כרגע. נסה/י שוב בעוד כמה רגעים." };

  if (!isAiConfigured()) return fallback;

  try {
    const client = getAnthropicClient();
    const message = await client.messages.create({
      model: AI_MODEL,
      max_tokens: AI_MAX_TOKENS,
      system,
      messages: [
        ...history.map((h) => ({ role: h.role, content: h.content })),
        { role: "user" as const, content: userMessage },
      ],
      output_config: { effort: CHAT_EFFORT },
    });

    if (message.stop_reason === "refusal") {
      console.error("askAssistant: AI refused");
      return fallback;
    }

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text" || !textBlock.text.trim()) return fallback;

    return { text: textBlock.text.trim() };
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      console.error("askAssistant: rate limited", error.message);
    } else if (error instanceof Anthropic.APIConnectionError) {
      console.error("askAssistant: connection error", error.message);
    } else if (error instanceof Anthropic.APIError) {
      console.error(`askAssistant: API error ${error.status}`, error.message);
    } else {
      console.error("askAssistant: unexpected error", error);
    }
    return fallback;
  }
}
