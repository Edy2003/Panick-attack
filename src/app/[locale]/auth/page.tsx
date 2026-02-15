"use client";

import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { AuthForm } from "@/components/auth/AuthForm";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const { isLoading, user, isAuthenticated, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-4">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">{t("loggedIn")}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        <div className="flex flex-col gap-2 w-full max-w-sm">
          <Link href={`/${locale}/settings/contacts`}>
            <Button variant="outline" className="w-full">
              {t("manageContacts")}
            </Button>
          </Link>
          <Button variant="ghost" onClick={signOut} className="w-full">
            <LogOut className="h-4 w-4" />
            {t("signOut")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-4">
      <AuthForm />
      <Link
        href={`/${locale}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        {t("skipAuth")}
      </Link>
    </div>
  );
}
