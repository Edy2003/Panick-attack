"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Phone, Lock } from "lucide-react";
import { useSOS } from "@/hooks/useSOS";
import { SOSConfirmation } from "@/components/sos/SOSConfirmation";

export function SOSButton() {
  const [isPressed, setIsPressed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const t = useTranslations("sos");
  const tCommon = useTranslations("common");
  const locale = useLocale() as "uk" | "en";

  const {
    isSending,
    isCountdown,
    countdown,
    lastResult,
    error,
    startCountdown,
    cancelCountdown,
    isAuthenticated,
  } = useSOS(locale);

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
        onMouseDown={() => isAuthenticated && setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onTouchStart={() => isAuthenticated && setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        disabled={!isAuthenticated}
        className={`
          fixed bottom-20 right-4 z-50
          flex h-14 w-14 items-center justify-center
          rounded-full text-white
          shadow-lg
          transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
          ${
            isAuthenticated
              ? "bg-sos-red shadow-sos-red/30 hover:shadow-xl hover:shadow-sos-red/40 focus-visible:ring-sos-red active:scale-95 dark:shadow-sos-red/20 dark:hover:shadow-sos-red/30"
              : "bg-gray-400 shadow-gray-400/30 cursor-not-allowed opacity-60"
          }
          ${isPressed ? "scale-95" : ""}
        `}
        aria-label={isAuthenticated ? t("button") : tCommon("signInRequired")}
        title={isAuthenticated ? t("button") : tCommon("signInRequired")}
      >
        {isAuthenticated ? (
          <Phone className="h-6 w-6" />
        ) : (
          <Lock className="h-6 w-6" />
        )}
        {isAuthenticated && (
          <span className="absolute -inset-1 animate-ping motion-reduce:animate-none rounded-full bg-sos-red/20 dark:bg-sos-red/30" />
        )}
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
