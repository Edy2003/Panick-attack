"use client";

import { useState } from "react";
import { Phone } from "lucide-react";

export function SOSButton() {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      type="button"
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
      aria-label="SOS — надіслати сигнал допомоги"
    >
      <Phone className="h-6 w-6" />
      <span className="absolute -inset-1 animate-ping rounded-full bg-sos-red/20 dark:bg-sos-red/30" />
    </button>
  );
}
