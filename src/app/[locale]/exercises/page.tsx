"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Wind, Hand } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function ExercisesPage() {
  const t = useTranslations("exercises");
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-6 p-4 pb-24">
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("description")}</p>

      <div className="flex flex-col gap-3">
        <Link href={`/${locale}/exercises/breathing`}>
          <Card className="flex items-center gap-4 p-4 transition-colors hover:border-primary/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-calm-blue/20 dark:bg-calm-blue/30">
              <Wind className="h-6 w-6 text-calm-blue" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold">{t("breathing")}</span>
              <span className="text-sm text-muted-foreground">
                {t("breathingDesc")}
              </span>
            </div>
          </Card>
        </Link>

        <Link href={`/${locale}/exercises/grounding`}>
          <Card className="flex items-center gap-4 p-4 transition-colors hover:border-primary/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-soft-green/20 dark:bg-soft-green/30">
              <Hand className="h-6 w-6 text-soft-green" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold">{t("grounding")}</span>
              <span className="text-sm text-muted-foreground">
                {t("groundingDesc")}
              </span>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
