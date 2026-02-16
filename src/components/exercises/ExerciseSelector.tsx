"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import {
  BREATHING_PATTERNS,
  PATTERN_KEYS,
  getCycleDuration,
} from "@/lib/exercises/breathing-patterns";

interface ExerciseSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
}

export function ExerciseSelector({ selected, onSelect }: ExerciseSelectorProps) {
  const t = useTranslations("breathing");

  return (
    <div className="grid grid-cols-2 gap-3">
      {PATTERN_KEYS.map((key) => {
        const pattern = BREATHING_PATTERNS[key];
        const isSelected = selected === key;
        const cycleSec = getCycleDuration(pattern);
        const timing = pattern.steps.map((s) => s.duration).join("-");

        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
          >
            <Card
              className={`flex flex-col gap-1 p-3 transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 dark:bg-primary/20"
                  : "hover:border-primary/50"
              }`}
            >
              <span className="text-sm font-semibold">
                {t(`patterns.${key}.name`)}
              </span>
              <span className="text-xs text-muted-foreground">
                {timing} · {cycleSec}{t("sec")}
              </span>
              <span className="text-xs text-muted-foreground">
                {pattern.recommendedCycles} {t("cycles")}
              </span>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
