"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Languages, User } from "lucide-react";
import { useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const t = useTranslations("common");
  const locale = useLocale() as "uk" | "en";
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const toggleLanguage = useCallback(() => {
    const newLocale = locale === "uk" ? "en" : "uk";
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  }, [locale, pathname, router]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 glass">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold text-foreground">
            {t("appName")}
          </span>
        </Link>

        <div className="flex items-center gap-2">
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

          {/* Auth/Profile Link */}
          <Link
            href={`/${locale}/auth`}
            className={`flex items-center justify-center rounded-full p-2 transition-all hover:bg-muted active:scale-95 ${
              isAuthenticated
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground"
            }`}
            aria-label={isAuthenticated ? t("profile") : t("signIn")}
            title={isAuthenticated ? t("profile") : t("signIn")}
          >
            <User className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
