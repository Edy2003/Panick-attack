"use client";

import { useLocale } from "next-intl";
import { VoiceChat } from "@/components/chat/VoiceChat";

export default function ChatPage() {
  const locale = useLocale() as "uk" | "en";

  return <VoiceChat language={locale} />;
}
