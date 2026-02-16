export type BreathingPhase = "inhale" | "hold" | "exhale" | "holdAfterExhale";

export interface BreathingStep {
  phase: BreathingPhase;
  duration: number; // seconds
}

export interface BreathingPattern {
  id: string;
  steps: BreathingStep[];
  recommendedCycles: number;
}

export const BREATHING_PATTERNS: Record<string, BreathingPattern> = {
  box: {
    id: "box",
    steps: [
      { phase: "inhale", duration: 4 },
      { phase: "hold", duration: 4 },
      { phase: "exhale", duration: 4 },
      { phase: "holdAfterExhale", duration: 4 },
    ],
    recommendedCycles: 6,
  },
  fourSevenEight: {
    id: "fourSevenEight",
    steps: [
      { phase: "inhale", duration: 4 },
      { phase: "hold", duration: 7 },
      { phase: "exhale", duration: 8 },
    ],
    recommendedCycles: 4,
  },
  diaphragmatic: {
    id: "diaphragmatic",
    steps: [
      { phase: "inhale", duration: 5 },
      { phase: "exhale", duration: 5 },
    ],
    recommendedCycles: 8,
  },
  physiologicalSigh: {
    id: "physiologicalSigh",
    steps: [
      { phase: "inhale", duration: 1 },
      { phase: "inhale", duration: 1 }, // double inhale
      { phase: "exhale", duration: 6 },
    ],
    recommendedCycles: 5,
  },
};

export const PATTERN_KEYS = Object.keys(BREATHING_PATTERNS) as Array<
  keyof typeof BREATHING_PATTERNS
>;

/** Get total duration of one cycle in seconds */
export function getCycleDuration(pattern: BreathingPattern): number {
  return pattern.steps.reduce((sum, step) => sum + step.duration, 0);
}

/** Phase color mapping (Tailwind class-friendly) */
export function getPhaseColor(phase: BreathingPhase): string {
  switch (phase) {
    case "inhale":
      return "calm-blue";
    case "hold":
    case "holdAfterExhale":
      return "lavender";
    case "exhale":
      return "soft-green";
  }
}
