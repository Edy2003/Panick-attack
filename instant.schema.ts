import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    profiles: i.entity({
      displayName: i.string().optional(),
      language: i.string(), // 'uk' | 'en'
      isGuest: i.boolean(), // Track if user is anonymous/guest
      // Telegram OAuth fields
      telegramUserId: i.string().unique().optional().indexed(),
      telegramUsername: i.string().optional(),
      telegramFirstName: i.string().optional(),
      telegramPhotoUrl: i.string().optional(),
      telegramAuthDate: i.number().optional(),
      createdAt: i.date(),
      updatedAt: i.date(),
    }),
    emergencyContacts: i.entity({
      displayName: i.string(),
      telegramChatId: i.string().indexed(), // Required: the Telegram chat ID
      telegramChatType: i.string(), // 'private' | 'group' | 'supergroup'
      telegramChatTitle: i.string().optional(), // For groups
      telegramChatPhoto: i.string().optional(),
      inviteToken: i.string().unique().indexed(), // Unique invite token
      invitedAt: i.date(), // When invite was generated
      acceptedAt: i.date().optional(), // When invite was accepted (null = pending)
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

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
