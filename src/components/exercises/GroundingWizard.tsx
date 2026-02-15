"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GroundingStep } from "./GroundingStep";
import { useGroundingExercise, TOTAL_STEPS } from "@/hooks/useGroundingExercise";

export function GroundingWizard() {
  const t = useTranslations("grounding");
  const prefersReducedMotion = useReducedMotion();

  const {
    status,
    currentStep,
    requiredCount,
    currentItems,
    isStepComplete,
    progress,
    start,
    addItem,
    nextStep,
    reset,
  } = useGroundingExercise();

  return (
    <div className="flex flex-col gap-6">
      {/* Progress bar */}
      {status !== "intro" && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {status === "finished"
                ? t("allDone")
                : `${t("step")} ${currentStep + 1} / ${TOTAL_STEPS}`}
            </span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-soft-green"
              animate={{ width: `${progress * 100}%` }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 0.4, ease: "easeOut" }
              }
            />
          </div>
        </div>
      )}

      {/* Intro */}
      {status === "intro" && (
        <motion.div
          className="flex flex-col items-center gap-6 py-8"
          initial={prefersReducedMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2 className="text-center text-2xl font-bold">{t("introTitle")}</h2>
          <p className="max-w-sm text-center text-muted-foreground">
            {t("introDesc")}
          </p>
          <Button onClick={start} size="lg" className="min-w-[160px]">
            {t("begin")}
          </Button>
        </motion.div>
      )}

      {/* Active step */}
      {status === "active" && (
        <GroundingStep
          key={currentStep}
          stepIndex={currentStep}
          requiredCount={requiredCount}
          items={currentItems}
          isComplete={isStepComplete}
          onAddItem={addItem}
          onNext={nextStep}
        />
      )}

      {/* Finished */}
      {status === "finished" && (
        <motion.div
          className="flex flex-col items-center gap-6 py-8"
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-5xl" role="img" aria-hidden="true">
            🌿
          </span>
          <h2 className="text-center text-2xl font-bold text-soft-green">
            {t("finishedTitle")}
          </h2>
          <p className="max-w-sm text-center text-muted-foreground">
            {t("finishedDesc")}
          </p>
          <Button onClick={reset} variant="outline" size="lg">
            {t("tryAgain")}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
