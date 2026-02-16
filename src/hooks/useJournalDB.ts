"use client";

import { useCallback, useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useAuth } from "@/hooks/useAuth";
import { id, tx } from "@instantdb/react";
import type { JournalEntry as LocalJournalEntry } from "@/lib/storage/journal";
import { getAllEntries as getLocalEntries } from "@/lib/storage/journal";

export interface JournalEntry {
  id: string;
  anxietyLevel: number;
  triggers: string[];
  symptoms: string[];
  copingTechniques: string[];
  durationMinutes?: number;
  notes?: string;
  createdAt: number;
}

/**
 * Journal hook with InstantDB sync
 * Automatically migrates localStorage data on first use
 */
export function useJournalDB() {
  const { user, isAuthenticated } = useAuth();
  const [migrated, setMigrated] = useState(false);

  // Query journal entries from InstantDB
  const { data, isLoading, error } = db.useQuery(
    isAuthenticated && user
      ? {
          journalEntries: {
            $: {
              where: {
                "owner.id": user.id,
              },
            },
          },
        }
      : { journalEntries: {} }
  );

  const entries: JournalEntry[] =
    data?.journalEntries?.map((entry: any) => ({
      id: entry.id,
      anxietyLevel: entry.anxietyLevel,
      triggers: entry.triggers || [],
      symptoms: entry.symptoms || [],
      copingTechniques: entry.copingTechniques || [],
      durationMinutes: entry.durationMinutes,
      notes: entry.notes,
      createdAt: new Date(entry.createdAt).getTime(),
    })) || [];

  // Sort by date (newest first)
  const sortedEntries = [...entries].sort((a, b) => b.createdAt - a.createdAt);

  // Migrate localStorage data to InstantDB on first load
  useEffect(() => {
    if (!isAuthenticated || !user || migrated) return;

    const migrateLocalData = async () => {
      try {
        const localEntries = getLocalEntries();

        // Check if user already has entries in DB
        if (entries.length > 0) {
          setMigrated(true);
          return;
        }

        // Only migrate if there's local data
        if (localEntries.length === 0) {
          setMigrated(true);
          return;
        }

        console.log(`Migrating ${localEntries.length} journal entries to InstantDB...`);

        // Batch insert all entries
        const txs = localEntries.map((entry) =>
          tx.journalEntries[id()].update({
            anxietyLevel: entry.anxietyLevel,
            triggers: entry.triggers,
            symptoms: entry.symptoms,
            copingTechniques: entry.copingTechniques,
            durationMinutes: entry.durationMinutes,
            notes: entry.notes,
            createdAt: new Date(entry.createdAt),
          }).link({ owner: user.id })
        );

        await db.transact(txs);

        console.log("✅ Journal migration complete");
        setMigrated(true);

        // Optionally clear localStorage after successful migration
        // localStorage.removeItem("panic-helper:journal");
      } catch (err) {
        console.error("Journal migration failed:", err);
      }
    };

    migrateLocalData();
  }, [isAuthenticated, user, entries.length, migrated]);

  // Add new entry
  const add = useCallback(
    async (entry: Omit<JournalEntry, "id" | "createdAt">): Promise<boolean> => {
      if (!isAuthenticated || !user) return false;

      try {
        await db.transact([
          tx.journalEntries[id()].update({
            anxietyLevel: entry.anxietyLevel,
            triggers: entry.triggers,
            symptoms: entry.symptoms,
            copingTechniques: entry.copingTechniques,
            durationMinutes: entry.durationMinutes,
            notes: entry.notes,
            createdAt: new Date(),
          }).link({ owner: user.id }),
        ]);
        return true;
      } catch (err) {
        console.error("Failed to add journal entry:", err);
        return false;
      }
    },
    [isAuthenticated, user]
  );

  // Delete entry
  const remove = useCallback(
    async (entryId: string): Promise<boolean> => {
      if (!isAuthenticated) return false;

      try {
        await db.transact([tx.journalEntries[entryId].delete()]);
        return true;
      } catch (err) {
        console.error("Failed to delete journal entry:", err);
        return false;
      }
    },
    [isAuthenticated]
  );

  // Export data
  const exportData = useCallback(
    (format: "json" | "csv") => {
      const dateStr = new Date().toISOString().slice(0, 10);

      if (format === "json") {
        const data = JSON.stringify(sortedEntries, null, 2);
        downloadFile(data, `anxiety-journal-${dateStr}.json`, "application/json");
        return;
      }

      // CSV export
      const headers = [
        "date",
        "anxiety_level",
        "triggers",
        "symptoms",
        "coping_techniques",
        "duration_minutes",
        "notes",
      ];

      const sanitize = (val: string) => {
        const escaped = val.replace(/"/g, '""');
        if (/^[=+\-@\t\r|!]/.test(escaped)) {
          return `"'${escaped}"`;
        }
        return `"${escaped}"`;
      };

      const rows = sortedEntries.map((e) => [
        new Date(e.createdAt).toISOString(),
        e.anxietyLevel.toString(),
        sanitize((e.triggers || []).join(", ")),
        sanitize((e.symptoms || []).join(", ")),
        sanitize((e.copingTechniques || []).join(", ")),
        (e.durationMinutes || 0).toString(),
        sanitize(e.notes || ""),
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      downloadFile(csv, `anxiety-journal-${dateStr}.csv`, "text/csv");
    },
    [sortedEntries]
  );

  return {
    entries: sortedEntries,
    loading: isLoading,
    error,
    add,
    remove,
    exportData,
  };
}

function downloadFile(data: string, filename: string, mimeType: string) {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
