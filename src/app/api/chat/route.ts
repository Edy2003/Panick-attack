import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/ai/chat-service";

const MAX_MESSAGE_LENGTH = 500;
const MAX_REQUESTS_PER_HOUR = 60;
const MAX_MESSAGES_PER_SESSION = 30;
const MAX_RATE_LIMITER_ENTRIES = 10000;

// Simple in-memory rate limiter (resets on deploy)
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  // Prevent unbounded growth
  if (rateLimiter.size > MAX_RATE_LIMITER_ENTRIES) {
    for (const [key, entry] of rateLimiter) {
      if (now > entry.resetAt) rateLimiter.delete(key);
    }
  }

  const entry = rateLimiter.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + 3600_000 });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_HOUR) {
    return false;
  }

  entry.count += 1;
  return true;
}

interface ChatRequestBody {
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  language: "uk" | "en";
  messageCount?: number;
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests. Please try again later.",
          },
        },
        { status: 429 }
      );
    }

    const body = (await request.json()) as ChatRequestBody;
    const { message, history, language, messageCount } = body;

    // Validate message
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_MESSAGE",
            message: "Message is required.",
          },
        },
        { status: 400 }
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        {
          error: {
            code: "MESSAGE_TOO_LONG",
            message: `Message must be under ${MAX_MESSAGE_LENGTH} characters.`,
          },
        },
        { status: 400 }
      );
    }

    // Validate language
    if (language !== "uk" && language !== "en") {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_LANGUAGE",
            message: "Language must be 'uk' or 'en'.",
          },
        },
        { status: 400 }
      );
    }

    // Validate history
    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            (msg) =>
              msg &&
              typeof msg.role === "string" &&
              typeof msg.content === "string" &&
              (msg.role === "user" || msg.role === "assistant")
          )
          .slice(-20)
      : [];

    // Check session message limit (server-side via history length)
    if (safeHistory.length >= MAX_MESSAGES_PER_SESSION) {
      return NextResponse.json(
        {
          error: {
            code: "SESSION_LIMIT_REACHED",
            message: "Session message limit reached. Please start a new session.",
          },
        },
        { status: 429 }
      );
    }

    const result = await chat({
      message: message.trim(),
      history: safeHistory,
      language,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Chat API error:", error);

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Something went wrong. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}
