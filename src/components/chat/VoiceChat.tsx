"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Send, Loader2 } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { ChatBubble } from "./ChatBubble";
import { VoiceButton } from "./VoiceButton";

interface VoiceChatProps {
  language: "uk" | "en";
}

export function VoiceChat({ language }: VoiceChatProps) {
  const t = useTranslations("chat");
  const [textInput, setTextInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, error, sendMessage } = useChat({ language });

  const { speak, stop: stopSpeaking, isSpeaking, isSupported: ttsSupported } =
    useSpeechSynthesis({ language });

  const handleResult = (transcript: string) => {
    if (transcript.trim().length > 0) {
      sendMessage(transcript);
    }
  };

  const {
    isListening,
    isSupported: sttSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    language,
    onResult: handleResult,
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-speak assistant replies
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage &&
      lastMessage.role === "assistant" &&
      ttsSupported &&
      !lastMessage.isCrisis
    ) {
      speak(lastMessage.content);
    }
  }, [messages, ttsSupported, speak]);

  const handleToggleVoice = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim().length === 0 || isLoading) return;
    sendMessage(textInput.trim());
    setTextInput("");
  };

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col">
      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-lg text-muted-foreground">
              {t("greeting")}
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-card px-4 py-3 shadow-sm dark:glass dark:border dark:border-border">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-center gap-2 border-t border-border/50 pt-3">
        {sttSupported && (
          <VoiceButton
            isListening={isListening}
            isSpeaking={isSpeaking}
            isSupported={sttSupported}
            onToggle={handleToggleVoice}
            ariaLabel={
              isListening ? t("stopListening") : t("startListening")
            }
          />
        )}
        <form onSubmit={handleTextSubmit} className="flex flex-1 gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={t("placeholder")}
            disabled={isLoading}
            className="flex-1 rounded-full border border-input bg-background px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || textInput.trim().length === 0}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            aria-label={t("send")}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
