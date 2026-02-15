"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Phone } from "lucide-react";
import { useSOS } from "@/hooks/useSOS";
import { SOSConfirmation } from "@/components/sos/SOSConfirmation";

export function SOSButton() {
  const [isPressed, setIsPressed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const t = useTranslations("sos");
  const locale = useLocale() as "uk" | "en";

  const {
    isSending,
    isCountdown,
    countdown,
    lastResult,
    error,
    startCountdown,
    cancelCountdown,
    flushQueue,
  } = useSOS(locale);

  // Flush offline queue when coming back online
  useEffect(() => {
    const handleOnline = () => flushQueue();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [flushQueue]);

  const handlePress = useCallback(() => {
    setShowConfirm(true);
  }, []);

  const handleConfirm = useCallback(() => {
    // Try to get location, then start countdown
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          startCountdown({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Location denied — send without location
          startCountdown();
        },
        { timeout: 5000 }
      );
    } else {
      startCountdown();
    }
  }, [startCountdown]);

  const handleCancel = useCallback(() => {
    cancelCountdown();
    setShowConfirm(false);
  }, [cancelCountdown]);

  return (
    <>
      <button
        type="button"
        onClick={handlePress}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        className={`
          fixed bottom-20 right-4 z-50
          flex h-14 w-14 items-center justify-center
          rounded-full bg-sos-red text-white
          shadow-lg shadow-sos-red/30
          transition-all duration-200
          hover:shadow-xl hover:shadow-sos-red/40
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sos-red focus-visible:ring-offset-2
          active:scale-95
          dark:shadow-sos-red/20 dark:hover:shadow-sos-red/30
          ${isPressed ? "scale-95" : ""}
        `}
        aria-label={t("button")}
      >
        <Phone className="h-6 w-6" />
        <span className="absolute -inset-1 animate-ping rounded-full bg-sos-red/20 dark:bg-sos-red/30" />
      </button>

      <SOSConfirmation
        open={showConfirm}
        isCountdown={isCountdown}
        countdown={countdown}
        isSending={isSending}
        error={error}
        lastResult={lastResult}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}
