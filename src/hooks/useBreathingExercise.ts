"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  BreathingPattern,
  BreathingPhase,
} from "@/lib/exercises/breathing-patterns";

type ExerciseStatus = "idle" | "running" | "paused" | "finished";

interface BreathingState {
  status: ExerciseStatus;
  currentStepIndex: number;
  currentPhase: BreathingPhase;
  phaseTimeLeft: number; // seconds remaining in current phase
  phaseDuration: number; // total seconds for current phase
  cycle: number; // current cycle (1-based)
  totalCycles: number;
}

const TICK_MS = 100; // 100ms tick for smoother progress

export function useBreathingExercise(pattern: BreathingPattern) {
  const [state, setState] = useState<BreathingState>({
    status: "idle",
    currentStepIndex: 0,
    currentPhase: pattern.steps[0].phase,
    phaseTimeLeft: pattern.steps[0].duration,
    phaseDuration: pattern.steps[0].duration,
    cycle: 1,
    totalCycles: pattern.recommendedCycles,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Haptic feedback
  const vibrate = useCallback((ms: number) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(ms);
    }
  }, []);

  const tick = useCallback(() => {
    setState((prev) => {
      if (prev.status !== "running") return prev;

      const newTimeLeft = Math.round((prev.phaseTimeLeft - TICK_MS / 1000) * 10) / 10;

      if (newTimeLeft > 0) {
        return { ...prev, phaseTimeLeft: newTimeLeft };
      }

      // Phase complete — move to next step
      const nextStepIndex = prev.currentStepIndex + 1;

      if (nextStepIndex < pattern.steps.length) {
        // Next step within same cycle
        const nextStep = pattern.steps[nextStepIndex];
        return {
          ...prev,
          currentStepIndex: nextStepIndex,
          currentPhase: nextStep.phase,
          phaseTimeLeft: nextStep.duration,
          phaseDuration: nextStep.duration,
        };
      }

      // Cycle complete
      const nextCycle = prev.cycle + 1;

      if (nextCycle > prev.totalCycles) {
        // All cycles done
        return { ...prev, status: "finished", phaseTimeLeft: 0 };
      }

      // Start next cycle
      const firstStep = pattern.steps[0];
      return {
        ...prev,
        currentStepIndex: 0,
        currentPhase: firstStep.phase,
        phaseTimeLeft: firstStep.duration,
        phaseDuration: firstStep.duration,
        cycle: nextCycle,
      };
    });
  }, [pattern]);

  // Phase transition — vibrate
  const prevPhaseRef = useRef(state.currentPhase);
  useEffect(() => {
    if (state.currentPhase !== prevPhaseRef.current && state.status === "running") {
      vibrate(50);
      prevPhaseRef.current = state.currentPhase;
    }
  }, [state.currentPhase, state.status, vibrate]);

  const start = useCallback(() => {
    clearTimer();
    const firstStep = pattern.steps[0];
    setState({
      status: "running",
      currentStepIndex: 0,
      currentPhase: firstStep.phase,
      phaseTimeLeft: firstStep.duration,
      phaseDuration: firstStep.duration,
      cycle: 1,
      totalCycles: pattern.recommendedCycles,
    });
    vibrate(100);
    intervalRef.current = setInterval(tick, TICK_MS);
  }, [pattern, clearTimer, tick, vibrate]);

  const pause = useCallback(() => {
    clearTimer();
    setState((prev) => ({ ...prev, status: "paused" }));
  }, [clearTimer]);

  const resume = useCallback(() => {
    setState((prev) => ({ ...prev, status: "running" }));
    intervalRef.current = setInterval(tick, TICK_MS);
  }, [tick]);

  const stop = useCallback(() => {
    clearTimer();
    const firstStep = pattern.steps[0];
    setState({
      status: "idle",
      currentStepIndex: 0,
      currentPhase: firstStep.phase,
      phaseTimeLeft: firstStep.duration,
      phaseDuration: firstStep.duration,
      cycle: 1,
      totalCycles: pattern.recommendedCycles,
    });
  }, [pattern, clearTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // Reset when pattern changes
  useEffect(() => {
    clearTimer();
    const firstStep = pattern.steps[0];
    setState({
      status: "idle",
      currentStepIndex: 0,
      currentPhase: firstStep.phase,
      phaseTimeLeft: firstStep.duration,
      phaseDuration: firstStep.duration,
      cycle: 1,
      totalCycles: pattern.recommendedCycles,
    });
  }, [pattern, clearTimer]);

  /** Progress within current phase: 0 (start) → 1 (end) */
  const phaseProgress =
    state.phaseDuration > 0
      ? 1 - state.phaseTimeLeft / state.phaseDuration
      : 0;

  return {
    ...state,
    phaseProgress,
    start,
    pause,
    resume,
    stop,
  };
}
