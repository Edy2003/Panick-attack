"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GroundingItem } from "@/hooks/useGroundingExercise";

interface GroundingStepProps {
  stepIndex: number; // 0-based
  requiredCount: number;
  items: GroundingItem[];
  isComplete: boolean;
  onAddItem: (text: string) => void;
  onNext: () => void;
}

const SENSE_ICONS = ["👁️", "✋", "👂", "👃", "👅"];
const STEP_COLORS = [
  "calm-blue",
  "lavender",
  "soft-green",
  "peach",
  "calm-blue",
];

export function GroundingStep({
  stepIndex,
  requiredCount,
  items,
  isComplete,
  onAddItem,
  onNext,
}: GroundingStepProps) {
  const t = useTranslations("grounding");
  const prefersReducedMotion = useReducedMotion();
  const [input, setInput] = useState("");

  const senseIcon = SENSE_ICONS[stepIndex] ?? "👁️";
  const color = STEP_COLORS[stepIndex] ?? "calm-blue";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim().length === 0) return;
    onAddItem(input.trim());
    setInput("");
  };

  return (
    <motion.div
      className="flex flex-col items-center gap-6"
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Step indicator */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-5xl" role="img" aria-hidden="true">
          {senseIcon}
        </span>
        <h2 className="text-center text-2xl font-bold">
          {t(`steps.${stepIndex}.title`, { count: requiredCount })}
        </h2>
        <p className="text-center text-muted-foreground">
          {t(`steps.${stepIndex}.hint`)}
        </p>
      </div>

      {/* Items entered */}
      <div className="flex min-h-[80px] flex-wrap justify-center gap-2">
        {items.map((item, i) => (
          <motion.span
            key={i}
            className={`inline-flex items-center gap-1 rounded-full bg-${color}/20 px-3 py-1.5 text-sm font-medium`}
            initial={prefersReducedMotion ? {} : { scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Check className="h-3.5 w-3.5 text-soft-green" />
            {item.text}
          </motion.span>
        ))}
      </div>

      {/* Input or next button */}
      {!isComplete ? (
        <form onSubmit={handleSubmit} className="flex w-full max-w-xs gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("inputPlaceholder")}
            aria-label={t("inputPlaceholder")}
            autoFocus
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={input.trim().length === 0}
            aria-label={t("add")}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-soft-green">
            {t("stepComplete")}
          </p>
          <Button onClick={onNext} size="lg">
            {stepIndex < 4 ? t("next") : t("finish")}
          </Button>
        </div>
      )}

      {/* Counter */}
      <div className="text-sm text-muted-foreground">
        {items.length} / {requiredCount}
      </div>
    </motion.div>
  );
}
