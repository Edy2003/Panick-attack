"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ArticleCard } from "@/components/library/ArticleCard";
import { SearchBar } from "@/components/library/SearchBar";
import {
  searchArticles,
  getBookmarks,
  toggleBookmark,
  CATEGORIES,
} from "@/lib/content/articles";

export default function LibraryPage() {
  const t = useTranslations("library");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    setBookmarks(getBookmarks());
  }, []);

  const articles = useMemo(() => {
    let results = searchArticles(locale, query);
    if (filter === "bookmarks") {
      results = results.filter((a) => bookmarks.includes(a.slug));
    } else if (filter) {
      results = results.filter((a) => a.category === filter);
    }
    return results;
  }, [locale, query, filter, bookmarks]);

  const handleToggleBookmark = useCallback((slug: string) => {
    toggleBookmark(slug);
    setBookmarks(getBookmarks());
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("description")}</p>

      <SearchBar value={query} onChange={setQuery} />

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter(null)}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            filter === null
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {t("allArticles")}
        </button>
        <button
          type="button"
          onClick={() => setFilter("bookmarks")}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            filter === "bookmarks"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {t("bookmarked")}
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(filter === cat ? null : cat)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              filter === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {t(`categories.${cat}`)}
          </button>
        ))}
      </div>

      {/* Articles */}
      {articles.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          {t("noResults")}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {articles.map((article) => (
            <ArticleCard
              key={article.slug}
              article={article}
              isBookmarked={bookmarks.includes(article.slug)}
              onToggleBookmark={handleToggleBookmark}
            />
          ))}
        </div>
      )}
    </div>
  );
}
