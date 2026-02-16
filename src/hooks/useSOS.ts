"use client";

import { useState, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";

const COUNTDOWN_SECONDS = 3;

interface SOSResult {
  contactId: string;
  status: "sent" | "failed";
  error?: string;
}

export function useSOS(language: "uk" | "en" = "uk") {
  const { user, isAuthenticated } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [isCountdown, setIsCountdown] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [lastResult, setLastResult] = useState<SOSResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef(false);

  // Require authentication
  const sendSOS = useCallback(
    async (location?: { lat: number; lng: number }) => {
      if (!isAuthenticated || !user) {
        setError(
          language === "uk"
            ? "Для використання SOS потрібна авторизація"
            : "Authentication required to use SOS"
        );
        return false;
      }

      setIsSending(true);
      setError(null);
      setLastResult(null);

      try {
        const response = await fetch("/api/sos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ location, language }),
          credentials: "include", // Include cookies for authentication
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to send SOS");
          return false;
        }

        setLastResult(data.results);
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to send SOS"
        );
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [isAuthenticated, user, language]
  );

  const startCountdown = useCallback(
    (location?: { lat: number; lng: number }) => {
      if (!isAuthenticated || !user) {
        setError(
          language === "uk"
            ? "Для використання SOS потрібна авторизація"
            : "Authentication required to use SOS"
        );
        return;
      }

      abortRef.current = false;
      setIsCountdown(true);
      setCountdown(COUNTDOWN_SECONDS);
      setError(null);
      setLastResult(null);

      let remaining = COUNTDOWN_SECONDS;

      countdownRef.current = setInterval(() => {
        if (abortRef.current) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          setIsCountdown(false);
          return;
        }

        remaining -= 1;
        setCountdown(remaining);

        if (remaining <= 0) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          setIsCountdown(false);
          sendSOS(location);
        }
      }, 1000);
    },
    [isAuthenticated, user, language, sendSOS]
  );

  const cancelCountdown = useCallback(() => {
    abortRef.current = true;
    if (countdownRef.current) clearInterval(countdownRef.current);
    setIsCountdown(false);
    setCountdown(COUNTDOWN_SECONDS);
    setLastResult(null);
    setError(null);
  }, []);

  return {
    isSending,
    isCountdown,
    countdown,
    lastResult,
    error,
    startCountdown,
    cancelCountdown,
    sendSOS,
    isAuthenticated,
  };
}
