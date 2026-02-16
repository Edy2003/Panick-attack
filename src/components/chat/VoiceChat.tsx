"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Send, Loader2, Mic, Keyboard } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { ChatBubble } from "./ChatBubble";
import { VoiceButton } from "./VoiceButton";

interface VoiceChatProps {
  language: "uk" | "en";
}

type InputMode = "voice" | "text";

export function VoiceChat({ language }: VoiceChatProps) {
  const t = useTranslations("chat");
  const [textInput, setTextInput] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("voice");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSpokenRef = useRef<string | null>(null);

  const { messages, isLoading, error, sendMessage } = useChat({ language });

  const { speak, stop: stopSpeaking, isSpeaking, isSupported: ttsSupported } =
    useSpeechSynthesis({ language });

  const handleResult = useCallback(
    (transcript: string) => {
      if (transcript.trim().length > 0) {
        sendMessage(transcript);
      }
    },
    [sendMessage]
  );

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

  // Auto-speak assistant replies (track last spoken to prevent re-trigger)
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage &&
      lastMessage.role === "assistant" &&
      ttsSupported &&
      !lastMessage.isCrisis &&
      lastMessage.id !== lastSpokenRef.current
    ) {
      lastSpokenRef.current = lastMessage.id;
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
      {/* Mode Toggle */}
      <div className="mb-3 flex items-center justify-center gap-2">
        <button
          onClick={() => setInputMode("voice")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
            inputMode === "voice"
              ? "bg-calm-blue text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
          aria-label={t("voiceMode")}
        >
          <Mic className="h-4 w-4" />
          {t("voiceMode")}
        </button>
        <button
          onClick={() => setInputMode("text")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
            inputMode === "text"
              ? "bg-calm-blue text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
          aria-label={t("textMode")}
        >
          <Keyboard className="h-4 w-4" />
          {t("textMode")}
        </button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 space-y-3 overflow-y-auto pb-4"
        role="log"
        aria-live="polite"
      >
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

      {/* Input - Voice Mode */}
      {inputMode === "voice" && sttSupported && (
        <div className="flex flex-col items-center gap-3 border-t border-border/50 pt-4">
          <p className="text-sm text-muted-foreground">
            {isListening
              ? t("listeningHint")
              : t("tapToSpeak")}
          </p>
          <button
            onClick={handleToggleVoice}
            disabled={isLoading}
            className={`flex h-20 w-20 items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:opacity-50 ${
              isListening
                ? "animate-pulse bg-sos-red shadow-lg shadow-sos-red/30"
                : "bg-calm-blue shadow-lg shadow-calm-blue/30 hover:scale-105"
            }`}
            aria-label={
              isListening ? t("stopListening") : t("startListening")
            }
          >
            <Mic className="h-8 w-8 text-white" />
          </button>
          {isSpeaking && (
            <p className="text-xs text-muted-foreground">
              {t("speaking")}
            </p>
          )}
        </div>
      )}

      {/* Input - Text Mode */}
      {inputMode === "text" && (
        <div className="flex items-center gap-2 border-t border-border/50 pt-3">
          <form onSubmit={handleTextSubmit} className="flex flex-1 gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={t("placeholder")}
              aria-label={t("placeholder")}
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
      )}
    </div>
  );
}
