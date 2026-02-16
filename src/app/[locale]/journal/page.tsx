"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Plus, Download, Trash2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QuickLogForm } from "@/components/journal/QuickLogForm";
import { AnxietyChart } from "@/components/journal/AnxietyChart";
import { useJournalDB } from "@/hooks/useJournalDB";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function JournalPage() {
  const t = useTranslations("journal");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { isAuthenticated } = useAuth();
  const { entries, loading, add, remove, exportData } = useJournalDB();
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (entry: Parameters<typeof add>[0]) => {
    const success = await add(entry);
    if (success) {
      setShowForm(false);
    }
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const levelColor = (level: number) => {
    if (level <= 3) return "text-soft-green";
    if (level <= 6) return "text-calm-blue";
    if (level <= 8) return "text-lavender";
    return "text-peach";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        {t("loading")}
      </div>
    );
  }

  // Show auth prompt for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="rounded-full bg-primary/10 p-4">
          <LogIn className="h-8 w-8 text-primary" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">{t("authRequired")}</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            {t("authRequiredDesc")}
          </p>
        </div>
        <Link href={`/${locale}/auth`}>
          <Button>
            <LogIn className="mr-2 h-4 w-4" />
            {tCommon("signIn")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        {entries.length > 0 && !showForm && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => exportData("csv")}
              aria-label={t("exportCSV")}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">{t("description")}</p>

      {/* Chart */}
      {entries.length > 0 && !showForm && (
        <AnxietyChart entries={entries} />
      )}

      {/* New entry form */}
      {showForm ? (
        <QuickLogForm
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <>
          <Button onClick={() => setShowForm(true)} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            {t("addEntry")}
          </Button>

          {/* Entries list */}
          {entries.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {t("noEntries")}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {entries.map((entry) => (
                <Card
                  key={entry.id}
                  className="flex items-start justify-between gap-3 p-3"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-lg font-bold ${levelColor(entry.anxietyLevel)}`}
                      >
                        {entry.anxietyLevel}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(entry.createdAt)}
                      </span>
                      {entry.durationMinutes && entry.durationMinutes > 0 && (
                        <span className="text-xs text-muted-foreground">
                          · {entry.durationMinutes} {t("min")}
                        </span>
                      )}
                    </div>
                    {entry.triggers.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {entry.triggers.map((tr) => (
                          <span
                            key={tr}
                            className="rounded-full bg-muted px-2 py-0.5 text-[11px]"
                          >
                            {t(`triggerOptions.${tr}`, { defaultValue: tr })}
                          </span>
                        ))}
                      </div>
                    )}
                    {entry.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      if (window.confirm(t("confirmDelete"))) {
                        remove(entry.id);
                      }
                    }}
                    aria-label={t("delete")}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
