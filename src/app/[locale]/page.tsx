"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  MessageCircle,
  Wind,
  Hand,
  BookOpen,
} from "lucide-react";

const quickActions = [
  {
    href: "/chat",
    icon: MessageCircle,
    titleKey: "chat" as const,
    descKey: "chatDesc" as const,
    color: "bg-calm-blue/10 text-calm-blue dark:bg-calm-blue/20",
  },
  {
    href: "/exercises/breathing",
    icon: Wind,
    titleKey: "breathing" as const,
    descKey: "breathingDesc" as const,
    color: "bg-soft-green/10 text-soft-green dark:bg-soft-green/20",
  },
  {
    href: "/exercises/grounding",
    icon: Hand,
    titleKey: "grounding" as const,
    descKey: "groundingDesc" as const,
    color: "bg-lavender/10 text-lavender dark:bg-lavender/20",
  },
  {
    href: "/journal",
    icon: BookOpen,
    titleKey: "journal" as const,
    descKey: "journalDesc" as const,
    color: "bg-peach/10 text-peach dark:bg-peach/20",
  },
];

export default function Home() {
  const t = useTranslations("home");

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="pt-4 text-center">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          {t("hero")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </section>

      {/* Quick actions grid */}
      <section className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex flex-col gap-3 rounded-2xl border border-border/50 bg-card p-4 shadow-sm transition-all hover:shadow-md dark:glass dark:border-border"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.color}`}
            >
              <action.icon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-semibold text-card-foreground">
                {t(action.titleKey)}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {t(action.descKey)}
              </p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
