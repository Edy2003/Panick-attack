import type { InstantRules } from "@instantdb/react";

const rules = {
  profiles: {
    allow: {
      view: "isOwner",
      create: "isOwner",
      update: "isOwner",
      delete: "false",
    },
    bind: {
      isOwner: "auth.id in data.ref('owner.id')",
    },
  },
  emergencyContacts: {
    allow: {
      view: "isOwner",
      create: "isOwner",
      update: "isOwner",
      delete: "isOwner",
    },
    bind: {
      isOwner: "auth.id in data.ref('owner.id')",
    },
  },
  journalEntries: {
    allow: {
      view: "isOwner",
      create: "isOwner",
      update: "isOwner",
      delete: "isOwner",
    },
    bind: {
      isOwner: "auth.id in data.ref('owner.id')",
    },
  },
  deviceTokens: {
    allow: {
      // Device tokens managed only via admin SDK on server
      $default: "false",
    },
  },
} satisfies InstantRules;

export default rules;
