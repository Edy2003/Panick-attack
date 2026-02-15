-- ============================================
-- Function: auto-update updated_at on row change
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Function: auto-create profile on user signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, language)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', ''), 'uk');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
