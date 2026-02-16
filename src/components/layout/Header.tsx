"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Languages } from "lucide-react";
import { useCallback } from "react";

export function Header() {
  const t = useTranslations("common");
  const locale = useLocale() as "uk" | "en";
  const router = useRouter();
  const pathname = usePathname();

  const toggleLanguage = useCallback(() => {
    const newLocale = locale === "uk" ? "en" : "uk";
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  }, [locale, pathname, router]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 glass">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold text-foreground">
            {t("appName")}
          </span>
        </Link>

        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-muted/80 active:scale-95"
          aria-label={t("switchLanguage")}
          title={t("switchLanguage")}
        >
          <Languages className="h-3.5 w-3.5" />
          <span className="uppercase">{locale}</span>
        </button>
      </div>
    </header>
  );
}
