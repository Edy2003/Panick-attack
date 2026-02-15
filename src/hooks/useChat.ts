"use client";

import { useState, useCallback, useRef } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isCrisis?: boolean;
}

interface UseChatOptions {
  language: "uk" | "en";
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

let messageCounter = 0;

function generateId(): string {
  messageCounter += 1;
  return `msg-${Date.now()}-${messageCounter}`;
}

export function useChat({ language }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  const sendMessage = useCallback(
    async (content: string) => {
      if (content.trim().length === 0) return;

      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: content.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const history = messagesRef.current.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content.trim(),
            history,
            language,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMessage =
            data?.error?.message ?? "Something went wrong.";
          setError(errorMessage);
          return;
        }

        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: data.reply,
          timestamp: Date.now(),
          isCrisis: data.isCrisis,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        setError(
          language === "uk"
            ? "Не вдалося зʼєднатися. Спробуйте ще раз."
            : "Could not connect. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [language]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearMessages };
}
