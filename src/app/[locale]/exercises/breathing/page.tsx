"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Play, Pause, Square } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { BreathingCircle } from "@/components/exercises/BreathingCircle";
import { ExerciseSelector } from "@/components/exercises/ExerciseSelector";
import { useBreathingExercise } from "@/hooks/useBreathingExercise";
import { BREATHING_PATTERNS } from "@/lib/exercises/breathing-patterns";

export default function BreathingPage() {
  const t = useTranslations("breathing");
  const locale = useLocale();
  const [selectedPattern, setSelectedPattern] = useState("box");

  const pattern = useMemo(
    () => BREATHING_PATTERNS[selectedPattern],
    [selectedPattern]
  );

  const {
    status,
    currentPhase,
    phaseProgress,
    phaseTimeLeft,
    phaseDuration,
    cycle,
    totalCycles,
    start,
    pause,
    resume,
    stop,
  } = useBreathingExercise(pattern);

  const isActive = status === "running" || status === "paused";

  const handlePatternChange = (id: string) => {
    if (isActive) stop();
    setSelectedPattern(id);
  };

  return (
    <div className="flex flex-col gap-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link
          href={`/${locale}/exercises`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold">{t("title")}</h1>
      </div>

      <p className="text-sm text-muted-foreground">{t("description")}</p>

      {/* Exercise selector — hidden during active exercise */}
      {!isActive && status !== "finished" && (
        <ExerciseSelector
          selected={selectedPattern}
          onSelect={handlePatternChange}
        />
      )}

      {/* Breathing circle */}
      <div className="flex justify-center py-4">
        <BreathingCircle
          phase={currentPhase}
          phaseProgress={phaseProgress}
          phaseTimeLeft={phaseTimeLeft}
          phaseDuration={phaseDuration}
          cycle={cycle}
          totalCycles={totalCycles}
          isRunning={status === "running"}
        />
      </div>

      {/* Finished message */}
      {status === "finished" && (
        <div className="text-center">
          <p className="text-lg font-medium text-soft-green">{t("finished")}</p>
          <p className="text-sm text-muted-foreground">{t("finishedDesc")}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {status === "idle" && (
          <Button onClick={start} size="lg" className="min-w-[160px]">
            <Play className="mr-2 h-5 w-5" />
            {t("start")}
          </Button>
        )}

        {status === "running" && (
          <>
            <Button onClick={pause} variant="outline" size="lg">
              <Pause className="mr-2 h-5 w-5" />
              {t("pause")}
            </Button>
            <Button onClick={stop} variant="ghost" size="lg">
              <Square className="mr-2 h-5 w-5" />
              {t("stop")}
            </Button>
          </>
        )}

        {status === "paused" && (
          <>
            <Button onClick={resume} size="lg">
              <Play className="mr-2 h-5 w-5" />
              {t("resume")}
            </Button>
            <Button onClick={stop} variant="ghost" size="lg">
              <Square className="mr-2 h-5 w-5" />
              {t("stop")}
            </Button>
          </>
        )}

        {status === "finished" && (
          <Button onClick={start} size="lg" className="min-w-[160px]">
            <Play className="mr-2 h-5 w-5" />
            {t("restart")}
          </Button>
        )}
      </div>
    </div>
  );
}
