"use client";

import { useState, useCallback, useRef } from "react";

const DEVICE_TOKEN_KEY = "panic-helper:device-token";
const SOS_QUEUE_KEY = "panic-helper:sos-queue";
const COUNTDOWN_SECONDS = 3;

interface SOSQueueItem {
  id: string;
  location?: { lat: number; lng: number };
  timestamp: number;
  retryCount: number;
}

interface SOSResult {
  contactId: string;
  channel: string;
  status: "sent" | "failed";
  error?: string;
}

function getDeviceToken(): string {
  if (typeof window === "undefined") return "";

  let token = localStorage.getItem(DEVICE_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
  }
  return token;
}

function getSOSQueue(): SOSQueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SOS_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSOSQueue(queue: SOSQueueItem[]) {
  localStorage.setItem(SOS_QUEUE_KEY, JSON.stringify(queue));
}

export function useSOS(language: "uk" | "en" = "uk") {
  const [isSending, setIsSending] = useState(false);
  const [isCountdown, setIsCountdown] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [lastResult, setLastResult] = useState<SOSResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef(false);

  const sendSOS = useCallback(
    async (location?: { lat: number; lng: number }) => {
      setIsSending(true);
      setError(null);
      setLastResult(null);

      const token = getDeviceToken();

      try {
        const response = await fetch("/api/sos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Device-Token": token,
          },
          body: JSON.stringify({ location, language }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error?.message ?? "Failed to send SOS");
          return false;
        }

        setLastResult(data.results);
        return true;
      } catch (err) {
        // Offline — queue for later
        if (!navigator.onLine) {
          const queue = getSOSQueue();
          queue.push({
            id: crypto.randomUUID(),
            location,
            timestamp: Date.now(),
            retryCount: 0,
          });
          saveSOSQueue(queue);
          setError(
            language === "uk"
              ? "Немає з'єднання. SOS буде надіслано при відновленні."
              : "No connection. SOS will be sent when online."
          );
          return false;
        }

        setError(
          err instanceof Error ? err.message : "Failed to send SOS"
        );
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [language]
  );

  const startCountdown = useCallback(
    (location?: { lat: number; lng: number }) => {
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
    [sendSOS]
  );

  const cancelCountdown = useCallback(() => {
    abortRef.current = true;
    if (countdownRef.current) clearInterval(countdownRef.current);
    setIsCountdown(false);
    setCountdown(COUNTDOWN_SECONDS);
    setLastResult(null);
    setError(null);
  }, []);

  const flushQueue = useCallback(async () => {
    const queue = getSOSQueue();
    if (queue.length === 0) return;

    const token = getDeviceToken();
    const remaining: SOSQueueItem[] = [];

    for (const item of queue) {
      if (item.retryCount >= 3) continue;

      try {
        const response = await fetch("/api/sos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Device-Token": token,
          },
          body: JSON.stringify({ location: item.location, language }),
        });

        if (!response.ok) {
          remaining.push({ ...item, retryCount: item.retryCount + 1 });
        }
      } catch {
        remaining.push({ ...item, retryCount: item.retryCount + 1 });
      }
    }

    saveSOSQueue(remaining);
  }, [language]);

  return {
    isSending,
    isCountdown,
    countdown,
    lastResult,
    error,
    startCountdown,
    cancelCountdown,
    sendSOS,
    flushQueue,
    getDeviceToken,
  };
}
