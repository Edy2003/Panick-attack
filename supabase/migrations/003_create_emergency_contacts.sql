-- Emergency contacts
CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    telegram_chat_id TEXT,
    telegram_username TEXT,
    telegram_link_token TEXT UNIQUE,
    whatsapp_number TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE TRIGGER contacts_updated_at
    BEFORE UPDATE ON emergency_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for quick lookup by user
CREATE INDEX idx_emergency_contacts_user_id ON emergency_contacts(user_id);

-- Index for telegram link token resolution
CREATE INDEX idx_emergency_contacts_link_token ON emergency_contacts(telegram_link_token)
    WHERE telegram_link_token IS NOT NULL;
