"use client";

import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { GroundingWizard } from "@/components/exercises/GroundingWizard";

export default function GroundingPage() {
  const t = useTranslations("grounding");
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-6 p-4 pb-24">
      <div className="flex items-center gap-2">
        <Link
          href={`/${locale}/exercises`}
          className="text-muted-foreground hover:text-foreground"
          aria-label={t("backToExercises")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold">{t("title")}</h1>
      </div>

      <GroundingWizard />
    </div>
  );
}
