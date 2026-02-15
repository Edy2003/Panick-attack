"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Home,
  MessageCircle,
  Wind,
  BookOpen,
  Library,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  icon: LucideIcon;
  labelKey: "home" | "chat" | "exercises" | "journal" | "library";
}

const navItems: NavItem[] = [
  { href: "/", icon: Home, labelKey: "home" },
  { href: "/chat", icon: MessageCircle, labelKey: "chat" },
  { href: "/exercises", icon: Wind, labelKey: "exercises" },
  { href: "/journal", icon: BookOpen, labelKey: "journal" },
  { href: "/library", icon: Library, labelKey: "library" },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  // Strip locale prefix from pathname for matching
  const cleanPath = pathname.replace(/^\/(uk|en)/, "") || "/";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-background/80 glass safe-area-bottom">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? cleanPath === "/"
              : cleanPath.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1 transition-colors"
              aria-label={t(item.labelKey)}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <span className="absolute inset-0 rounded-xl bg-primary/10 dark:bg-primary/20" />
              )}
              <item.icon
                className={`relative h-5 w-5 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`relative text-[11px] font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
