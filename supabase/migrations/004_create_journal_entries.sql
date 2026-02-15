-- Journal entries
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    anxiety_level INTEGER CHECK (anxiety_level BETWEEN 1 AND 10),
    triggers TEXT[] DEFAULT '{}',
    symptoms TEXT[] DEFAULT '{}',
    coping_techniques TEXT[] DEFAULT '{}',
    duration_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user journal queries (newest first)
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id, created_at DESC);
