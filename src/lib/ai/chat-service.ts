import { GoogleGenerativeAI } from "@google/generative-ai";
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

  // Keep only last N messages for context, truncate content per message
  const recentHistory = history.slice(-MAX_HISTORY_MESSAGES).map((msg) => ({
    ...msg,
    content: msg.content.slice(0, MAX_INPUT_TOKENS * 4),
  }));

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: getSystemPrompt(language),
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_NONE",
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_NONE",
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_NONE",
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_NONE",
      },
    ],
  });

  // Convert history to Gemini format
  const geminiHistory = recentHistory.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({
    history: geminiHistory,
    generationConfig: {
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.7,
    },
  });

  let result;
  try {
    result = await chat.sendMessage(truncatedMessage);
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to generate response"
    );
  }

  const aiReply = result.response.text();

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
