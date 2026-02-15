"use client";

import { Mic, MicOff, Volume2 } from "lucide-react";

interface VoiceButtonProps {
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  onToggle: () => void;
  ariaLabel: string;
}

export function VoiceButton({
  isListening,
  isSpeaking,
  isSupported,
  onToggle,
  ariaLabel,
}: VoiceButtonProps) {
  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isSpeaking}
      className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 ${
        isListening
          ? "bg-sos-red text-white shadow-lg shadow-sos-red/30"
          : "bg-primary text-primary-foreground shadow-md"
      }`}
      aria-label={ariaLabel}
    >
      {isSpeaking ? (
        <Volume2 className="h-5 w-5 animate-pulse" />
      ) : isListening ? (
        <MicOff className="h-5 w-5" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </button>
  );
}
