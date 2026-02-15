-- ============================================
-- Enable Row Level Security on all tables
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Profiles: users can read/update only their own
-- ============================================
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- ============================================
-- Emergency contacts: full CRUD on own contacts
-- ============================================
CREATE POLICY "Users can manage own contacts"
    ON emergency_contacts FOR ALL
    USING (auth.uid() = user_id);

-- ============================================
-- Journal entries: full CRUD on own entries
-- ============================================
CREATE POLICY "Users can manage own journal"
    ON journal_entries FOR ALL
    USING (auth.uid() = user_id);

-- ============================================
-- Device tokens: NO public policies
-- Accessed only via service_role key in API routes
-- ============================================
