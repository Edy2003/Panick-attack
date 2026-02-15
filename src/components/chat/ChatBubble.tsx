"use client";

import type { ChatMessage } from "@/hooks/useChat";

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
          isUser
            ? "rounded-br-md bg-primary text-primary-foreground"
            : message.isCrisis
              ? "rounded-bl-md border border-sos-red/30 bg-sos-red/10 text-foreground"
              : "rounded-bl-md bg-card text-card-foreground shadow-sm dark:glass dark:border dark:border-border"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
