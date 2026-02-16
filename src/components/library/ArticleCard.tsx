"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Bookmark } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Article } from "@/lib/content/articles";

interface ArticleCardProps {
  article: Article;
  isBookmarked: boolean;
  onToggleBookmark: (slug: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  psychoeducation: "bg-calm-blue/20 text-calm-blue",
  techniques: "bg-soft-green/20 text-soft-green",
  support: "bg-lavender/20 text-lavender",
  professional: "bg-peach/20 text-peach",
};

export function ArticleCard({
  article,
  isBookmarked,
  onToggleBookmark,
}: ArticleCardProps) {
  const locale = useLocale();
  const t = useTranslations("library");

  return (
    <Card className="flex flex-col gap-2 p-4 transition-colors hover:border-primary/50">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/${locale}/library/${article.slug}`}
          className="flex-1"
        >
          <h3 className="font-semibold leading-tight hover:text-primary">
            {article.title}
          </h3>
        </Link>
        <button
          type="button"
          onClick={() => onToggleBookmark(article.slug)}
          className="shrink-0 p-1 text-muted-foreground transition-colors hover:text-primary"
          aria-label={isBookmarked ? t("removeBookmark") : t("addBookmark")}
        >
          <Bookmark
            className={`h-4 w-4 ${isBookmarked ? "fill-primary text-primary" : ""}`}
          />
        </button>
      </div>
      <Link href={`/${locale}/library/${article.slug}`}>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {article.summary}
        </p>
      </Link>
      <span
        className={`inline-block w-fit rounded-full px-2 py-0.5 text-[11px] font-medium ${CATEGORY_COLORS[article.category] ?? ""}`}
      >
        {t(`categories.${article.category}`)}
      </span>
    </Card>
  );
}
