"use client";

import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect } from "react";
import { ArrowLeft, Bookmark, ExternalLink } from "lucide-react";
import Link from "next/link";
import {
  getArticle,
  isBookmarked as checkBookmarked,
  toggleBookmark,
} from "@/lib/content/articles";

export default function ArticlePage() {
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations("library");
  const slug = params.slug as string;

  const article = getArticle(locale, slug);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    setBookmarked(checkBookmarked(slug));
  }, [slug]);

  if (!article) {
    return (
      <div className="flex flex-col items-center gap-4 p-4 pt-12">
        <p className="text-muted-foreground">{t("notFound")}</p>
        <Link
          href={`/${locale}/library`}
          className="text-primary underline"
        >
          {t("backToLibrary")}
        </Link>
      </div>
    );
  }

  const handleToggle = () => {
    toggleBookmark(slug);
    setBookmarked(!bookmarked);
  };

  // Simple markdown-to-HTML rendering (headings, bold, lists, paragraphs)
  const renderContent = (md: string) => {
    return md.split("\n\n").map((block, i) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      // H2
      if (trimmed.startsWith("## ")) {
        return (
          <h2 key={i} className="mt-6 text-xl font-bold">
            {trimmed.slice(3)}
          </h2>
        );
      }

      // H3
      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={i} className="mt-4 text-lg font-semibold">
            {trimmed.slice(4)}
          </h3>
        );
      }

      // H4
      if (trimmed.startsWith("#### ")) {
        return (
          <h4 key={i} className="mt-3 font-semibold">
            {trimmed.slice(5)}
          </h4>
        );
      }

      // List
      if (trimmed.includes("\n-")) {
        const lines = trimmed.split("\n").filter(Boolean);
        return (
          <ul key={i} className="ml-4 list-disc space-y-1 text-sm">
            {lines.map((line, j) => {
              const content = line.replace(/^-\s*/, "");
              return (
                <li key={j}>
                  {renderInline(content)}
                </li>
              );
            })}
          </ul>
        );
      }

      // Numbered list
      if (/^\d+\.\s/.test(trimmed)) {
        const lines = trimmed.split("\n").filter(Boolean);
        return (
          <ol key={i} className="ml-4 list-decimal space-y-1 text-sm">
            {lines.map((line, j) => {
              const content = line.replace(/^\d+\.\s*/, "");
              return (
                <li key={j}>
                  {renderInline(content)}
                </li>
              );
            })}
          </ol>
        );
      }

      // Paragraph
      return (
        <p key={i} className="text-sm leading-relaxed">
          {renderInline(trimmed)}
        </p>
      );
    });
  };

  // Inline markdown: **bold**, "quoted"
  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/${locale}/library`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <button
          type="button"
          onClick={handleToggle}
          className="p-1 text-muted-foreground transition-colors hover:text-primary"
          aria-label={bookmarked ? t("removeBookmark") : t("addBookmark")}
        >
          <Bookmark
            className={`h-5 w-5 ${bookmarked ? "fill-primary text-primary" : ""}`}
          />
        </button>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold">{article.title}</h1>
      <p className="text-sm text-muted-foreground">{article.summary}</p>

      {/* Content */}
      <article className="flex flex-col gap-2">
        {renderContent(article.content)}
      </article>

      {/* Source */}
      {article.source && (
        <div className="mt-4 rounded-lg bg-muted p-3">
          <span className="text-xs text-muted-foreground">{t("source")}: </span>
          {article.sourceUrl ? (
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {article.source}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="text-xs">{article.source}</span>
          )}
        </div>
      )}
    </div>
  );
}
