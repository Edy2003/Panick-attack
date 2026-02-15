"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MessageCircle,
  Wind,
  BookOpen,
  Library,
} from "lucide-react";

const navItems = [
  { href: "/", icon: Home, label: "Головна" },
  { href: "/chat", icon: MessageCircle, label: "Чат" },
  { href: "/exercises", icon: Wind, label: "Вправи" },
  { href: "/journal", icon: BookOpen, label: "Журнал" },
  { href: "/library", icon: Library, label: "Статті" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-background/80 glass safe-area-bottom">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1 transition-colors"
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <span className="absolute inset-0 rounded-xl bg-primary/10 dark:bg-primary/20" />
              )}
              <item.icon
                className={`relative h-5 w-5 transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              />
              <span
                className={`relative text-[11px] font-medium transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
