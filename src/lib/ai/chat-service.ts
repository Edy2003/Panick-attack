import Anthropic from "@anthropic-ai/sdk";
import { getSystemPrompt } from "./system-prompt";
import { checkUserMessage, checkAIResponse, getCrisisResponse } from "./safety-filter";

const MAX_INPUT_TOKENS = 1000;
const MAX_OUTPUT_TOKENS = 300;
const MAX_HISTORY_MESSAGES = 20;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  message: string;
  history: ChatMessage[];
  language: "uk" | "en";
}

interface ChatResponse {
  reply: string;
  isCrisis: boolean;
}

export async function chat(request: ChatRequest): Promise<ChatResponse> {
  const { message, history, language } = request;

  // Pre-send safety filter
  const { isCrisis } = checkUserMessage(message);
  if (isCrisis) {
    return {
      reply: getCrisisResponse(language),
      isCrisis: true,
    };
  }

  // Truncate message to max input tokens (rough: 1 token ≈ 4 chars)
  const truncatedMessage = message.slice(0, MAX_INPUT_TOKENS * 4);

  // Keep only last N messages for context
  const recentHistory = history.slice(-MAX_HISTORY_MESSAGES);

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: MAX_OUTPUT_TOKENS,
    system: getSystemPrompt(language),
    messages: [
      ...recentHistory.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: truncatedMessage },
    ],
  });

  const aiReply =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Post-receive safety filter
  const { hasDiagnosis } = checkAIResponse(aiReply);
  if (hasDiagnosis) {
    const safeReply =
      language === "uk"
        ? "Я не можу ставити діагнози. Для професійної оцінки зверніться до лікаря. А зараз давайте зосередимося на тому, щоб вам стало легше."
        : "I cannot make diagnoses. Please consult a doctor for professional assessment. For now, let's focus on helping you feel better.";

    return { reply: safeReply, isCrisis: false };
  }

  return { reply: aiReply, isCrisis: false };
}
