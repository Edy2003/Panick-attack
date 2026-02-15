const JOURNAL_KEY = "panic-helper:journal";

export interface JournalEntry {
  id: string;
  anxietyLevel: number; // 1-10
  triggers: string[];
  symptoms: string[];
  copingTechniques: string[];
  durationMinutes: number;
  notes: string;
  createdAt: number; // timestamp
}

function getEntries(): JournalEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(JOURNAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: JournalEntry[]) {
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
}

export function getAllEntries(): JournalEntry[] {
  return getEntries().sort((a, b) => b.createdAt - a.createdAt);
}

export function getEntry(id: string): JournalEntry | undefined {
  return getEntries().find((e) => e.id === id);
}

export function addEntry(
  entry: Omit<JournalEntry, "id" | "createdAt">
): JournalEntry {
  const entries = getEntries();
  const newEntry: JournalEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  entries.push(newEntry);
  saveEntries(entries);
  return newEntry;
}

export function updateEntry(
  id: string,
  updates: Partial<Omit<JournalEntry, "id" | "createdAt">>
): JournalEntry | null {
  const entries = getEntries();
  const index = entries.findIndex((e) => e.id === id);
  if (index === -1) return null;

  entries[index] = { ...entries[index], ...updates };
  saveEntries(entries);
  return entries[index];
}

export function deleteEntry(id: string): boolean {
  const entries = getEntries();
  const filtered = entries.filter((e) => e.id !== id);
  if (filtered.length === entries.length) return false;
  saveEntries(filtered);
  return true;
}

export function exportEntries(
  format: "json" | "csv"
): { data: string; filename: string; mimeType: string } {
  const entries = getAllEntries();
  const dateStr = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    return {
      data: JSON.stringify(entries, null, 2),
      filename: `anxiety-journal-${dateStr}.json`,
      mimeType: "application/json",
    };
  }

  // CSV
  const headers = [
    "date",
    "anxiety_level",
    "triggers",
    "symptoms",
    "coping_techniques",
    "duration_minutes",
    "notes",
  ];

  const rows = entries.map((e) => [
    new Date(e.createdAt).toISOString(),
    e.anxietyLevel.toString(),
    `"${e.triggers.join(", ")}"`,
    `"${e.symptoms.join(", ")}"`,
    `"${e.copingTechniques.join(", ")}"`,
    e.durationMinutes.toString(),
    `"${e.notes.replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return {
    data: csv,
    filename: `anxiety-journal-${dateStr}.csv`,
    mimeType: "text/csv",
  };
}
