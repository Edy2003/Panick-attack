"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { TelegramAuthData } from "@/lib/auth/telegram-auth";

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramAuthData) => void;
  }
}

export function TelegramLoginButton() {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't load widget if user doesn't have an InstantDB session
    if (!user) return;

    // Don't load multiple times
    if (scriptLoadedRef.current) return;

    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

    if (!botUsername) {
      console.error("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME is not configured");
      return;
    }

    // Define global callback function
    window.onTelegramAuth = async (telegramUser: TelegramAuthData) => {
      setIsConnecting(true);
      setError(null);

      try {
        const response = await fetch("/api/auth/telegram/connect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Instant-User-Id": user.id,
          },
          body: JSON.stringify(telegramUser),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to connect Telegram");
        }

        // Success - page will refresh via InstantDB reactivity
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to connect");
      } finally {
        setIsConnecting(false);
      }
    };

    // Load Telegram Widget script
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    script.async = true;

    if (containerRef.current) {
      containerRef.current.appendChild(script);
      scriptLoadedRef.current = true;
    }

    return () => {
      // Cleanup
      delete window.onTelegramAuth;
      if (containerRef.current && script.parentNode === containerRef.current) {
        containerRef.current.removeChild(script);
      }
    };
  }, [user]);

  // Only show if user is authenticated with InstantDB but not connected to Telegram
  if (!user) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={containerRef} id="telegram-login-container" />
      {isConnecting && (
        <p className="text-sm text-muted-foreground">
          Connecting Telegram...
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
