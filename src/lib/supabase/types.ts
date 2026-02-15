export interface Profile {
  id: string;
  display_name: string | null;
  language: "uk" | "en";
  created_at: string;
  updated_at: string;
}

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  telegram_chat_id: string | null;
  telegram_username: string | null;
  telegram_link_token: string | null;
  whatsapp_number: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  anxiety_level: number;
  triggers: string[];
  symptoms: string[];
  coping_techniques: string[];
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
}

export interface DeviceToken {
  id: string;
  token: string;
  contacts: DeviceContact[];
  created_at: string;
}

export interface DeviceContact {
  name: string;
  telegram_chat_id?: string;
  telegram_username?: string;
  whatsapp_number?: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Pick<Profile, "display_name" | "language">>;
      };
      emergency_contacts: {
        Row: EmergencyContact;
        Insert: Omit<EmergencyContact, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Omit<EmergencyContact, "id" | "user_id" | "created_at" | "updated_at">
        >;
      };
      journal_entries: {
        Row: JournalEntry;
        Insert: Omit<JournalEntry, "id" | "created_at">;
        Update: Partial<Omit<JournalEntry, "id" | "user_id" | "created_at">>;
      };
      device_tokens: {
        Row: DeviceToken;
        Insert: Omit<DeviceToken, "id" | "created_at">;
        Update: Partial<Pick<DeviceToken, "contacts">>;
      };
    };
  };
}
