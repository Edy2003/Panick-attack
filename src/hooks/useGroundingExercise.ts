"use client";

import { useState, useCallback, useRef } from "react";

export interface GroundingItem {
  text: string;
  timestamp: number;
}

export interface GroundingStepState {
  items: GroundingItem[];
}

const STEP_COUNTS = [5, 4, 3, 2, 1] as const;
export const TOTAL_STEPS = STEP_COUNTS.length;

export type GroundingStatus = "intro" | "active" | "finished";

export function useGroundingExercise() {
  const [status, setStatus] = useState<GroundingStatus>("intro");
  const [currentStep, setCurrentStep] = useState(0); // 0-based index
  const [steps, setSteps] = useState<GroundingStepState[]>(
    STEP_COUNTS.map(() => ({ items: [] }))
  );

  const statusRef = useRef(status);
  statusRef.current = status;
  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;

  const requiredCount = STEP_COUNTS[currentStep] ?? 0;
  const currentItems = steps[currentStep]?.items ?? [];
  const isStepComplete = currentItems.length >= requiredCount;

  const start = useCallback(() => {
    setStatus("active");
    setCurrentStep(0);
    setSteps(STEP_COUNTS.map(() => ({ items: [] })));
  }, []);

  const addItem = useCallback(
    (text: string) => {
      if (statusRef.current !== "active") return;
      const step = currentStepRef.current;

      setSteps((prev) => {
        const updated = [...prev];
        const current = updated[step];
        if (!current || current.items.length >= STEP_COUNTS[step]) return prev;

        updated[step] = {
          items: [...current.items, { text: text.trim(), timestamp: Date.now() }],
        };
        return updated;
      });
    },
    []
  );

  const nextStep = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setStatus("finished");
    }
  }, [currentStep]);

  const reset = useCallback(() => {
    setStatus("intro");
    setCurrentStep(0);
    setSteps(STEP_COUNTS.map(() => ({ items: [] })));
  }, []);

  const progress = status === "finished"
    ? 1
    : status === "intro"
      ? 0
      : (currentStep + (isStepComplete ? 1 : currentItems.length / requiredCount)) / TOTAL_STEPS;

  return {
    status,
    currentStep,
    requiredCount,
    currentItems,
    isStepComplete,
    steps,
    progress,
    start,
    addItem,
    nextStep,
    reset,
  };
}
