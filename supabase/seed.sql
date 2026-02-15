-- ============================================
-- Seed data for development
-- ============================================
-- Note: Run this AFTER migrations.
-- Profiles are auto-created via handle_new_user() trigger,
-- so create a test user in Supabase Auth first,
-- then insert related data below.

-- Example: seed journal entries for a test user
-- Replace 'TEST_USER_UUID' with actual user id after signup
/*
INSERT INTO journal_entries (user_id, anxiety_level, triggers, symptoms, coping_techniques, duration_minutes, notes)
VALUES
    ('TEST_USER_UUID', 7, ARRAY['work', 'crowds'], ARRAY['heart_racing', 'shortness_of_breath'], ARRAY['breathing_4_7_8'], 15, 'Panic attack at the office'),
    ('TEST_USER_UUID', 4, ARRAY['caffeine'], ARRAY['trembling'], ARRAY['grounding_5_4_3_2_1', 'breathing_box'], 8, 'Mild episode after coffee'),
    ('TEST_USER_UUID', 9, ARRAY['public_transport'], ARRAY['heart_racing', 'dizziness', 'derealization'], ARRAY['breathing_4_7_8', 'grounding_5_4_3_2_1'], 25, 'Severe attack on metro');

INSERT INTO emergency_contacts (user_id, name, telegram_username, whatsapp_number, is_active)
VALUES
    ('TEST_USER_UUID', 'Мама', '@mama_test', '+380501234567', true),
    ('TEST_USER_UUID', 'Друг Олексій', '@oleksiy_test', NULL, true);
*/

-- Device token for anonymous testing
INSERT INTO device_tokens (token, contacts)
VALUES (
    'dev-test-token-12345',
    '[{"name": "Тест Контакт", "telegram_username": "@test_contact", "whatsapp_number": "+380509876543"}]'::jsonb
);
