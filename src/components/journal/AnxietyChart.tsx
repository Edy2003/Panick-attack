"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import type { JournalEntry } from "@/lib/storage/journal";

interface AnxietyChartProps {
  entries: JournalEntry[];
  days?: number;
}

export function AnxietyChart({ entries, days = 14 }: AnxietyChartProps) {
  const t = useTranslations("journal");

  const chartData = useMemo(() => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const recent = entries.filter((e) => e.createdAt >= cutoff);

    // Group by day
    const byDay = new Map<string, number[]>();
    for (const entry of recent) {
      const date = new Date(entry.createdAt).toLocaleDateString();
      const existing = byDay.get(date) ?? [];
      existing.push(entry.anxietyLevel);
      byDay.set(date, existing);
    }

    // Compute average per day
    const result: { date: string; avg: number; count: number }[] = [];
    for (const [date, levels] of byDay) {
      const avg = levels.reduce((s, v) => s + v, 0) / levels.length;
      result.push({ date, avg: Math.round(avg * 10) / 10, count: levels.length });
    }

    return result.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [entries, days]);

  if (chartData.length === 0) {
    return null;
  }

  const maxBars = 14;
  const visibleData = chartData.slice(-maxBars);

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-semibold">{t("chartTitle")}</h3>

      <div className="flex items-end gap-1.5" style={{ height: 120 }}>
        {visibleData.map((d, i) => {
          const heightPct = (d.avg / 10) * 100;
          const color =
            d.avg <= 3
              ? "bg-soft-green"
              : d.avg <= 6
                ? "bg-calm-blue"
                : d.avg <= 8
                  ? "bg-lavender"
                  : "bg-peach";

          return (
            <div
              key={i}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <span className="text-[10px] text-muted-foreground">
                {d.avg}
              </span>
              <div
                className={`w-full min-w-[8px] rounded-t ${color}`}
                style={{ height: `${heightPct}%` }}
                aria-label={`${d.date}: ${d.avg}`}
              />
              <span className="text-[9px] text-muted-foreground">
                {new Date(d.date).getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="mt-3 flex justify-between text-xs text-muted-foreground">
        <span>
          {t("totalEntries")}: {entries.length}
        </span>
        <span>
          {t("avgLevel")}:{" "}
          {entries.length > 0
            ? (
                entries.reduce((s, e) => s + e.anxietyLevel, 0) /
                entries.length
              ).toFixed(1)
            : "-"}
        </span>
      </div>
    </Card>
  );
}
