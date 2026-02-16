"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { BreathingPhase } from "@/lib/exercises/breathing-patterns";
import { getPhaseColor } from "@/lib/exercises/breathing-patterns";

interface BreathingCircleProps {
  phase: BreathingPhase;
  phaseProgress: number; // 0→1
  phaseTimeLeft: number;
  phaseDuration: number;
  cycle: number;
  totalCycles: number;
  isRunning: boolean;
}

const PHASE_SCALE: Record<BreathingPhase, [number, number]> = {
  inhale: [0.5, 1],
  hold: [1, 1],
  exhale: [1, 0.5],
  holdAfterExhale: [0.5, 0.5],
};

export function BreathingCircle({
  phase,
  phaseProgress,
  phaseTimeLeft,
  phaseDuration,
  cycle,
  totalCycles,
  isRunning,
}: BreathingCircleProps) {
  const t = useTranslations("breathing");
  const prefersReducedMotion = useReducedMotion();

  const color = getPhaseColor(phase);
  const [scaleFrom, scaleTo] = PHASE_SCALE[phase];
  const currentScale = prefersReducedMotion
    ? (scaleFrom + scaleTo) / 2
    : scaleFrom + (scaleTo - scaleFrom) * phaseProgress;

  const phaseLabel = t(`phase.${phase}`);
  const secondsDisplay = Math.ceil(phaseTimeLeft);

  // Color classes
  const colorMap: Record<string, { bg: string; ring: string; text: string }> = {
    "calm-blue": {
      bg: "bg-calm-blue/20 dark:bg-calm-blue/30",
      ring: "ring-calm-blue/50",
      text: "text-calm-blue",
    },
    lavender: {
      bg: "bg-lavender/20 dark:bg-lavender/30",
      ring: "ring-lavender/50",
      text: "text-lavender",
    },
    "soft-green": {
      bg: "bg-soft-green/20 dark:bg-soft-green/30",
      ring: "ring-soft-green/50",
      text: "text-soft-green",
    },
  };

  const colors = colorMap[color] ?? colorMap["calm-blue"];

  return (
    <div
      className="flex flex-col items-center gap-6"
      role="timer"
      aria-live="polite"
      aria-label={`${phaseLabel} — ${secondsDisplay} ${t("seconds")}`}
    >
      {/* Animated circle */}
      <div className="relative flex h-64 w-64 items-center justify-center">
        {/* Outer glow ring */}
        <motion.div
          className={`absolute h-64 w-64 rounded-full ${colors.bg} ring-2 ${colors.ring}`}
          animate={{
            scale: isRunning ? currentScale : 0.5,
            opacity: isRunning ? 1 : 0.5,
          }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.1, ease: "linear" }
          }
        />

        {/* Inner circle */}
        <motion.div
          className={`absolute h-48 w-48 rounded-full ${colors.bg}`}
          animate={{
            scale: isRunning ? currentScale : 0.5,
          }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.1, ease: "linear" }
          }
        />

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center gap-1">
          <span className={`text-3xl font-bold ${colors.text}`}>
            {secondsDisplay}
          </span>
          <span className="text-lg font-medium text-foreground">
            {phaseLabel}
          </span>
        </div>
      </div>

      {/* Cycle counter */}
      <div className="text-sm text-muted-foreground">
        {t("cycle")} {cycle} / {totalCycles}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={`h-full rounded-full`}
          style={{ backgroundColor: `var(--${color})` }}
          animate={{ width: `${phaseProgress * 100}%` }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.1, ease: "linear" }
          }
        />
      </div>
    </div>
  );
}
