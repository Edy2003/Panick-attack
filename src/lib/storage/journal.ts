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

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function isValidEntry(e: unknown): e is JournalEntry {
  if (typeof e !== "object" || e === null) return false;
  const obj = e as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    typeof obj.anxietyLevel === "number" &&
    Array.isArray(obj.triggers) &&
    Array.isArray(obj.symptoms) &&
    Array.isArray(obj.copingTechniques) &&
    typeof obj.durationMinutes === "number" &&
    typeof obj.notes === "string" &&
    typeof obj.createdAt === "number"
  );
}

function getEntries(): JournalEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(JOURNAL_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry);
  } catch {
    return [];
  }
}

function saveEntries(entries: JournalEntry[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

export function getAllEntries(): JournalEntry[] {
  return getEntries().sort((a, b) => b.createdAt - a.createdAt);
}

export function getEntry(id: string): JournalEntry | undefined {
  return getEntries().find((e) => e.id === id);
}

export function addEntry(
  entry: Omit<JournalEntry, "id" | "createdAt">
): JournalEntry | null {
  const entries = getEntries();
  const newEntry: JournalEntry = {
    ...entry,
    id: generateId(),
    createdAt: Date.now(),
  };
  entries.push(newEntry);
  if (!saveEntries(entries)) return null;
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
  if (!saveEntries(entries)) return null;
  return entries[index];
}

export function deleteEntry(id: string): boolean {
  const entries = getEntries();
  const filtered = entries.filter((e) => e.id !== id);
  if (filtered.length === entries.length) return false;
  return saveEntries(filtered);
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

  // Sanitize CSV cell to prevent formula injection
  const sanitize = (val: string) => {
    const escaped = val.replace(/"/g, '""');
    if (/^[=+\-@\t\r|!]/.test(escaped)) {
      return `"'${escaped}"`;
    }
    return `"${escaped}"`;
  };

  const rows = entries.map((e) => [
    new Date(e.createdAt).toISOString(),
    e.anxietyLevel.toString(),
    sanitize(e.triggers.join(", ")),
    sanitize(e.symptoms.join(", ")),
    sanitize(e.copingTechniques.join(", ")),
    e.durationMinutes.toString(),
    sanitize(e.notes),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return {
    data: csv,
    filename: `anxiety-journal-${dateStr}.csv`,
    mimeType: "text/csv",
  };
}
