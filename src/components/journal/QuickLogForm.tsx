"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface QuickLogFormProps {
  onSubmit: (entry: {
    anxietyLevel: number;
    triggers: string[];
    symptoms: string[];
    copingTechniques: string[];
    durationMinutes: number;
    notes: string;
  }) => void;
  onCancel: () => void;
}

const TRIGGER_KEYS = [
  "work",
  "social",
  "health",
  "finances",
  "relationships",
  "sleep",
  "caffeine",
  "unknown",
] as const;

const SYMPTOM_KEYS = [
  "heartRacing",
  "breathShort",
  "dizziness",
  "sweating",
  "trembling",
  "nausea",
  "chestPain",
  "derealisation",
] as const;

const COPING_KEYS = [
  "breathing",
  "grounding",
  "talking",
  "walking",
  "medication",
  "music",
  "cold",
  "nothing",
] as const;

function ToggleChip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        selected
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      }`}
    >
      {label}
    </button>
  );
}

export function QuickLogForm({ onSubmit, onCancel }: QuickLogFormProps) {
  const t = useTranslations("journal");
  const [anxietyLevel, setAnxietyLevel] = useState(5);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [copingTechniques, setCopingTechniques] = useState<string[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [notes, setNotes] = useState("");

  const toggleItem = (
    list: string[],
    setter: (v: string[]) => void,
    item: string
  ) => {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      anxietyLevel,
      triggers,
      symptoms,
      copingTechniques,
      durationMinutes,
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Anxiety level */}
      <Card className="p-4">
        <label className="mb-2 block text-sm font-semibold">
          {t("anxietyLevel")}
        </label>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-primary">
            {anxietyLevel}
          </span>
          <input
            type="range"
            min={1}
            max={10}
            value={anxietyLevel}
            onChange={(e) => setAnxietyLevel(Number(e.target.value))}
            className="flex-1 accent-primary"
            aria-label={t("anxietyLevel")}
          />
          <span className="text-xs text-muted-foreground">/ 10</span>
        </div>
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>{t("levelLow")}</span>
          <span>{t("levelHigh")}</span>
        </div>
      </Card>

      {/* Triggers */}
      <Card className="p-4">
        <label className="mb-2 block text-sm font-semibold">
          {t("triggers")}
        </label>
        <div className="flex flex-wrap gap-2">
          {TRIGGER_KEYS.map((key) => (
            <ToggleChip
              key={key}
              label={t(`triggerOptions.${key}`)}
              selected={triggers.includes(key)}
              onToggle={() => toggleItem(triggers, setTriggers, key)}
            />
          ))}
        </div>
      </Card>

      {/* Symptoms */}
      <Card className="p-4">
        <label className="mb-2 block text-sm font-semibold">
          {t("symptoms")}
        </label>
        <div className="flex flex-wrap gap-2">
          {SYMPTOM_KEYS.map((key) => (
            <ToggleChip
              key={key}
              label={t(`symptomOptions.${key}`)}
              selected={symptoms.includes(key)}
              onToggle={() => toggleItem(symptoms, setSymptoms, key)}
            />
          ))}
        </div>
      </Card>

      {/* Coping techniques */}
      <Card className="p-4">
        <label className="mb-2 block text-sm font-semibold">
          {t("copingTechniques")}
        </label>
        <div className="flex flex-wrap gap-2">
          {COPING_KEYS.map((key) => (
            <ToggleChip
              key={key}
              label={t(`copingOptions.${key}`)}
              selected={copingTechniques.includes(key)}
              onToggle={() =>
                toggleItem(copingTechniques, setCopingTechniques, key)
              }
            />
          ))}
        </div>
      </Card>

      {/* Duration */}
      <Card className="p-4">
        <label className="mb-2 block text-sm font-semibold">
          {t("duration")}
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={120}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="flex-1 accent-primary"
            aria-label={t("duration")}
          />
          <span className="min-w-[3rem] text-right text-sm font-medium">
            {durationMinutes} {t("min")}
          </span>
        </div>
      </Card>

      {/* Notes */}
      <Card className="p-4">
        <label className="mb-2 block text-sm font-semibold">{t("notes")}</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("notesPlaceholder")}
          rows={3}
          maxLength={1000}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          {t("cancel")}
        </Button>
        <Button type="submit" className="flex-1">
          {t("save")}
        </Button>
      </div>
    </form>
  );
}
