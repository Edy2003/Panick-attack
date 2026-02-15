"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getAllEntries,
  addEntry,
  deleteEntry,
  exportEntries,
  type JournalEntry,
} from "@/lib/storage/journal";

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setEntries(getAllEntries());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    (entry: Omit<JournalEntry, "id" | "createdAt">) => {
      addEntry(entry);
      refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    (id: string) => {
      deleteEntry(id);
      refresh();
    },
    [refresh]
  );

  const exportData = useCallback((format: "json" | "csv") => {
    const result = exportEntries(format);
    const blob = new Blob([result.data], { type: result.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return { entries, loading, add, remove, exportData, refresh };
}
