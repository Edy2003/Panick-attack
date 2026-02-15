"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";

export function Header() {
  const t = useTranslations("common");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 glass">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold text-foreground">
            {t("appName")}
          </span>
        </Link>
      </div>
    </header>
  );
}
