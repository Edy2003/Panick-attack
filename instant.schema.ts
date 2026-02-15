import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    profiles: i.entity({
      displayName: i.string().optional(),
      language: i.string(), // 'uk' | 'en'
      createdAt: i.date(),
      updatedAt: i.date(),
    }),
    emergencyContacts: i.entity({
      name: i.string(),
      telegramChatId: i.string().optional(),
      telegramUsername: i.string().optional(),
      telegramLinkToken: i.string().unique().optional().indexed(),
      whatsappNumber: i.string().optional(),
      isActive: i.boolean(),
      createdAt: i.date(),
      updatedAt: i.date(),
    }),
    journalEntries: i.entity({
      anxietyLevel: i.number().indexed(),
      triggers: i.json<string[]>(),
      symptoms: i.json<string[]>(),
      copingTechniques: i.json<string[]>(),
      durationMinutes: i.number().optional(),
      notes: i.string().optional(),
      createdAt: i.date().indexed(),
    }),
    deviceTokens: i.entity({
      token: i.string().unique().indexed(),
      contacts: i.json<DeviceContact[]>(),
      createdAt: i.date(),
    }),
  },
  links: {
    profileOwner: {
      forward: { on: "profiles", has: "one", label: "owner" },
      reverse: { on: "$users", has: "one", label: "profile" },
    },
    contactOwner: {
      forward: { on: "emergencyContacts", has: "one", label: "owner" },
      reverse: { on: "$users", has: "many", label: "emergencyContacts" },
    },
    journalOwner: {
      forward: { on: "journalEntries", has: "one", label: "owner" },
      reverse: { on: "$users", has: "many", label: "journalEntries" },
    },
  },
});

interface DeviceContact {
  name: string;
  telegramChatId?: string;
  telegramUsername?: string;
  whatsappNumber?: string;
}

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
