# SOS Redesign: Telegram Integration with Invite-Based Contact System

## Context

**Why this change**: Current SOS system uses device tokens for anonymous users and manual Telegram username entry. This leads to:
- Hardcoded user names ("User"/"Користувач")
- Fragile contact management (array index-based IDs)
- Requires users to manually share bot links
- Works only for individual contacts, not groups
- No integration with user authentication

**Goal**: Redesign SOS to use Telegram OAuth + invite-based contact system where authenticated users generate invite links, share them to desired chats (private or groups), and bot automatically captures chat metadata when recipients accept.

**Critical architectural constraint**: Telegram Bot API cannot retrieve a user's chat list due to privacy restrictions. Therefore, we implement an invite-based system instead of chat selection.

## Solution Approach

### New Flow

1. **User Authentication**: Connect Telegram account via Telegram Login Widget
2. **Invite Generation**: User generates unique invite link in app
3. **Manual Sharing**: User shares invite link to desired Telegram chats (private messages or groups)
4. **Acceptance**: Recipients click link → bot captures chat_id and metadata
5. **SOS Sending**: When SOS triggered, bot sends to all linked chat_ids

### Key Decisions

- ✅ Invite-based contact system (not chat list selection)
- ✅ Only Telegram (WhatsApp postponed)
- ✅ Only authenticated users (no device tokens)
- ✅ Hard reset migration (delete all old contacts)
- ✅ Show all chat types (private + groups) with filter option

## Database Schema Changes

### Update `profiles` entity

```typescript
profiles: i.entity({
  displayName: i.string().optional(),
  language: i.string(),
  isGuest: i.boolean(),

  // ADD:
  telegramUserId: i.string().unique().optional().indexed(),
  telegramUsername: i.string().optional(),
  telegramFirstName: i.string().optional(),
  telegramPhotoUrl: i.string().optional(),
  telegramAuthDate: i.number().optional(),

  createdAt: i.date(),
  updatedAt: i.date(),
}),
```

### Update `emergencyContacts` entity

```typescript
emergencyContacts: i.entity({
  // KEEP:
  displayName: i.string(),
  isActive: i.boolean(),
  createdAt: i.date(),
  updatedAt: i.date(),

  // CHANGE:
  telegramChatId: i.string().indexed(), // Required (was optional)

  // ADD:
  telegramChatType: i.string(), // 'private' | 'group' | 'supergroup'
  telegramChatTitle: i.string().optional(), // For groups
  telegramChatPhoto: i.string().optional(),
  inviteToken: i.string().unique().indexed(),
  invitedAt: i.date(),
  acceptedAt: i.date().optional(),

  // REMOVE:
  // telegramUsername
  // telegramLinkToken
  // whatsappNumber
}),
```

### Remove `deviceTokens` entity

Delete entirely - no longer needed.

## Implementation Steps

### Phase 1: Schema Migration & Cleanup

**Files to modify:**
- `instant.schema.ts`
- `src/lib/auth/device-token.ts` (DELETE)
- `src/hooks/useSOS.ts` (remove device token logic)
- `src/app/api/sos/route.ts` (remove device token auth)
- `src/app/api/contacts/route.ts` (remove device token operations)

**Steps:**
1. Update `instant.schema.ts` with new schema (above)
2. Push schema: `npx instant-cli push schema --yes`
3. Delete `src/lib/auth/device-token.ts`
4. Remove `panic-helper:device-token` localStorage references
5. Clear all existing `emergencyContacts` via InstantDB dashboard (hard reset)
6. Add migration banner: "SOS system updated - reconnect contacts"

### Phase 2: Telegram Login Widget Integration

**New files:**
- `src/components/auth/TelegramLoginButton.tsx`
- `src/lib/auth/telegram-auth.ts`
- `src/app/api/auth/telegram/callback/route.ts`

**Files to modify:**
- `src/app/[locale]/auth/page.tsx`
- `.env` and `.env.example` (add `TELEGRAM_BOT_USERNAME`)

**Steps:**

1. **Configure Bot**: Run `@BotFather` command `/setdomain yourapp.com` to register domain

2. **Create `src/lib/auth/telegram-auth.ts`:**
```typescript
import crypto from 'crypto';

export interface TelegramAuthData {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export function verifyTelegramAuth(data: TelegramAuthData): boolean {
  const { hash, ...fields } = data;

  const checkString = Object.keys(fields)
    .sort()
    .map(key => `${key}=${fields[key]}`)
    .join('\n');

  const secretKey = crypto
    .createHash('sha256')
    .update(process.env.TELEGRAM_BOT_TOKEN!)
    .digest();

  const hmac = crypto
    .createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex');

  return hmac === hash;
}
```

3. **Create `src/components/auth/TelegramLoginButton.tsx`:**
```typescript
"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export function TelegramLoginButton() {
  const { user } = useAuth();
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  useEffect(() => {
    // Load Telegram Widget script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-auth-url', `${window.location.origin}/api/auth/telegram/callback`);
    script.setAttribute('data-request-access', 'write');
    script.async = true;
    document.getElementById('telegram-login-container')?.appendChild(script);
  }, [botUsername]);

  return <div id="telegram-login-container" />;
}
```

4. **Create `src/app/api/auth/telegram/callback/route.ts`:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramAuth, type TelegramAuthData } from "@/lib/auth/telegram-auth";
import { adminDb } from "@/lib/db-admin";

export async function POST(request: NextRequest) {
  const data: TelegramAuthData = await request.json();

  // Verify hash
  if (!verifyTelegramAuth(data)) {
    return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
  }

  // Get authenticated user from session (InstantDB auth)
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: Verify InstantDB token and get user ID
  // const userId = await verifyInstantDBToken(authHeader);

  // Update user profile with Telegram data
  await adminDb.transact([
    adminDb.tx.profiles[userId].update({
      telegramUserId: data.id.toString(),
      telegramUsername: data.username,
      telegramFirstName: data.first_name,
      telegramPhotoUrl: data.photo_url,
      telegramAuthDate: data.auth_date,
      updatedAt: new Date(),
    }),
  ]);

  return NextResponse.json({ success: true });
}
```

5. **Update `.env.example`:**
```bash
# Telegram Bot Username (without @)
TELEGRAM_BOT_USERNAME=PanicAttackHelperBot
```

### Phase 3: Invite-Based Contact System

**New files:**
- `src/app/api/contacts/invite/route.ts`

**Files to modify:**
- `src/app/api/telegram/webhook/route.ts`
- `src/app/[locale]/settings/contacts/page.tsx` (complete rewrite)
- `src/app/api/contacts/route.ts`

**Steps:**

1. **Create `src/app/api/contacts/invite/route.ts`:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/db-admin";
import { id } from "@instantdb/react";

export async function POST(request: NextRequest) {
  // Get authenticated user
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: Verify user and get userId
  // const userId = await verifyInstantDBToken(authHeader);

  // Check max invites (10 per user)
  const existingContacts = await adminDb.query({
    emergencyContacts: {
      $: { where: { "owner.id": userId } }
    }
  });

  if (existingContacts.emergencyContacts.length >= 10) {
    return NextResponse.json({ error: "Maximum 10 contacts allowed" }, { status: 400 });
  }

  // Generate invite token
  const inviteToken = crypto.randomUUID();
  const botUsername = process.env.TELEGRAM_BOT_USERNAME;

  // Create pending contact
  await adminDb.transact([
    adminDb.tx.emergencyContacts[id()].update({
      displayName: "Pending...",
      telegramChatId: "", // Will be filled on acceptance
      telegramChatType: "",
      inviteToken,
      invitedAt: new Date(),
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).link({ owner: userId }),
  ]);

  return NextResponse.json({
    inviteLink: `https://t.me/${botUsername}?start=${inviteToken}`,
    inviteToken,
  });
}
```

2. **Update `src/app/api/telegram/webhook/route.ts`:**
```typescript
// ADD to existing webhook handler:

if (message.text?.startsWith('/start ')) {
  const inviteToken = message.text.split(' ')[1];

  // Find contact by invite token
  const result = await adminDb.query({
    emergencyContacts: {
      $: { where: { inviteToken } }
    }
  });

  const contact = result.emergencyContacts[0];
  if (!contact) {
    await sendTelegramMessage(chatId, "Invalid or expired invite link.");
    return NextResponse.json({ ok: true });
  }

  // Get chat info
  const chatInfo = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getChat?chat_id=${chatId}`
  ).then(r => r.json());

  // Update contact with chat details
  await adminDb.transact([
    adminDb.tx.emergencyContacts[contact.id].update({
      telegramChatId: chatId.toString(),
      telegramChatType: chatInfo.result.type,
      telegramChatTitle: chatInfo.result.title || chatInfo.result.first_name,
      telegramChatPhoto: chatInfo.result.photo?.big_file_id,
      displayName: chatInfo.result.title || `${chatInfo.result.first_name} ${chatInfo.result.last_name || ''}`.trim(),
      acceptedAt: new Date(),
      isActive: true,
      updatedAt: new Date(),
    }),
  ]);

  // Send confirmation
  const confirmText = chatInfo.result.type === 'private'
    ? `✅ You are now connected as emergency contact.`
    : `✅ This group is now registered as emergency contact.`;

  await sendTelegramMessage(chatId, confirmText);
  return NextResponse.json({ ok: true });
}
```

3. **Rewrite `src/app/[locale]/settings/contacts/page.tsx`:**
```typescript
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, Copy, Trash2, Clock, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/db";
import QRCode from "qrcode";

export default function ContactsPage() {
  const t = useTranslations("settings");
  const { user, isAuthenticated } = useAuth();
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [qrCode, setQRCode] = useState<string | null>(null);

  const { data, isLoading } = db.useQuery(
    isAuthenticated && user
      ? {
          emergencyContacts: {
            $: { where: { "owner.id": user.id } }
          }
        }
      : { emergencyContacts: {} }
  );

  const contacts = data?.emergencyContacts || [];
  const pendingContacts = contacts.filter(c => !c.acceptedAt);
  const activeContacts = contacts.filter(c => c.acceptedAt);

  const generateInvite = async () => {
    const response = await fetch("/api/contacts/invite", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${user.token}`,
      },
    });

    const { inviteLink } = await response.json();
    setInviteLink(inviteLink);

    // Generate QR code
    const qr = await QRCode.toDataURL(inviteLink);
    setQRCode(qr);
  };

  const deleteContact = async (contactId: string) => {
    await db.transact([db.tx.emergencyContacts[contactId].delete()]);
  };

  return (
    <div className="flex flex-col gap-6 p-4 pb-24">
      <h1 className="text-xl font-semibold">{t("contacts")}</h1>

      {/* Generate Invite */}
      {!inviteLink ? (
        <Button onClick={generateInvite} className="w-full">
          <Users className="mr-2 h-4 w-4" />
          {t("generateInvite")}
        </Button>
      ) : (
        <Card className="p-4">
          <h3 className="font-semibold mb-2">{t("shareInvite")}</h3>
          <p className="text-sm text-muted-foreground mb-3">
            {t("shareInviteDesc")}
          </p>

          {qrCode && (
            <img src={qrCode} alt="QR Code" className="mx-auto w-48 h-48 mb-3" />
          )}

          <div className="flex gap-2">
            <input
              value={inviteLink}
              readOnly
              className="flex-1 px-3 py-2 text-sm border rounded-lg"
            />
            <Button
              size="icon"
              onClick={() => navigator.clipboard.writeText(inviteLink)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            className="w-full mt-3"
            onClick={() => {
              setInviteLink(null);
              setQRCode(null);
            }}
          >
            {t("close")}
          </Button>
        </Card>
      )}

      {/* Pending Invites */}
      {pendingContacts.length > 0 && (
        <div>
          <h3 className="font-medium mb-2">{t("pendingInvites")}</h3>
          {pendingContacts.map(contact => (
            <Card key={contact.id} className="p-3 mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">{t("waitingForAcceptance")}</span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => deleteContact(contact.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Active Contacts */}
      {activeContacts.length > 0 && (
        <div>
          <h3 className="font-medium mb-2">{t("activeContacts")}</h3>
          {activeContacts.map(contact => (
            <Card key={contact.id} className="p-3 mb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <div>
                    <div className="font-medium">{contact.displayName}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {contact.telegramChatType === 'private' ? t("private") : t("group")}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    if (window.confirm(t("confirmDelete"))) {
                      deleteContact(contact.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeContacts.length === 0 && pendingContacts.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          {t("noContacts")}
        </div>
      )}
    </div>
  );
}
```

### Phase 4: SOS Flow Updates

**Files to modify:**
- `src/hooks/useSOS.ts` (major refactor)
- `src/app/api/sos/route.ts` (major refactor)
- `src/components/layout/SOSButton.tsx`
- `src/lib/messaging/message-template.ts`

**Steps:**

1. **Update `src/hooks/useSOS.ts`:**
```typescript
// REMOVE: device token logic, localStorage queue
// ADD: user authentication requirement
// ADD: fetch user profile for display name

export function useSOS() {
  const { user, isAuthenticated } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<SOSResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Require authentication
  if (!isAuthenticated || !user) {
    return {
      sendSOS: () => Promise.reject("Not authenticated"),
      isSending: false,
      isCountdown: false,
      countdown: null,
      lastResult: null,
      error: "Authentication required",
    };
  }

  const sendSOS = async () => {
    // Start countdown...
    // Get geolocation...
    // Send to API with user token...
  };

  return { sendSOS, isSending, isCountdown, countdown, lastResult, error };
}
```

2. **Update `src/app/api/sos/route.ts`:**
```typescript
export async function POST(request: NextRequest) {
  // REMOVE: device token auth
  // ADD: InstantDB user authentication

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: Verify InstantDB token
  // const userId = await verifyInstantDBToken(authHeader);

  // Get user profile for display name
  const profile = await adminDb.query({
    profiles: {
      $: { where: { "owner.id": userId } }
    }
  });

  const userName = profile.profiles[0]?.displayName
    || profile.profiles[0]?.telegramFirstName
    || "User"; // Fallback only if both missing

  // Query contacts by user ID (not device token)
  const contacts = await adminDb.query({
    emergencyContacts: {
      $: {
        where: {
          "owner.id": userId,
          isActive: true
        }
      }
    }
  });

  if (contacts.emergencyContacts.length === 0) {
    return NextResponse.json(
      { error: "No emergency contacts configured" },
      { status: 400 }
    );
  }

  // Send SOS to all chat IDs
  const results = await Promise.all(
    contacts.emergencyContacts.map(async (contact) => {
      try {
        const message = formatSOSMessage({
          userName,
          language,
          location,
          timestamp: new Date(),
        });

        await sendTelegramMessage(contact.telegramChatId, message);

        return {
          contactId: contact.id,
          status: "sent" as const,
        };
      } catch (error) {
        return {
          contactId: contact.id,
          status: "failed" as const,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    })
  );

  return NextResponse.json({ results });
}
```

3. **Update `src/components/layout/SOSButton.tsx`:**
```typescript
// ADD: Check authentication
const { isAuthenticated } = useAuth();

// CHANGE: Hide or disable button if not authenticated
if (!isAuthenticated) {
  return (
    <button
      className="... opacity-50 cursor-not-allowed"
      onClick={() => alert("Please sign in to use SOS")}
    >
      SOS
    </button>
  );
}
```

### Phase 5: Translations & Environment

**Files to modify:**
- `messages/uk.json`
- `messages/en.json`
- `.env.example`

**Add translations:**
```json
{
  "settings": {
    "generateInvite": "Згенерувати запрошення",
    "shareInvite": "Поділіться посиланням",
    "shareInviteDesc": "Надішліть це посилання контакту або додайте в групу Telegram",
    "pendingInvites": "Очікують підтвердження",
    "activeContacts": "Активні контакти",
    "waitingForAcceptance": "Очікує підтвердження",
    "private": "Приватний чат",
    "group": "Група",
    "confirmDelete": "Видалити цей контакт?"
  }
}
```

**Update `.env.example`:**
```bash
# Telegram Bot Username (without @)
TELEGRAM_BOT_USERNAME=PanicAttackHelperBot
```

## Bug Fixes

1. **User Display Name**: Get from `profiles.displayName` OR `profiles.telegramFirstName` (fixed in Phase 4, Step 2)
2. **Stable Contact IDs**: Use InstantDB entity UUIDs (automatic with new schema)
3. **Bot Username**: Add to env var `TELEGRAM_BOT_USERNAME` (fixed in Phase 2, Step 5)
4. **Rate Limiting**: Switch from device token to user ID as key (update in SOS API route)

## Migration Strategy

### Hard Reset Approach

1. **Before deployment:**
   - Show banner: "SOS system will be upgraded on [date]. You'll need to reconnect contacts."

2. **On deployment:**
   - Deploy new schema with `npx instant-cli push schema --yes`
   - Delete all `deviceTokens` entity records (via InstantDB dashboard)
   - Delete all `emergencyContacts` entity records (via InstantDB dashboard)
   - Clear `panic-helper:device-token` localStorage key (add to app init code)

3. **After deployment:**
   - Show onboarding flow guiding users through:
     1. Connect Telegram (if not already)
     2. Generate invite link
     3. Share to desired contacts/groups
     4. Wait for acceptance
     5. Test SOS (optional)

## Verification Plan

### Automated Tests

```typescript
// tests/e2e/telegram-auth.spec.ts
- Telegram Login Widget flow
- Profile updates with Telegram data

// tests/e2e/contact-invite.spec.ts
- Generate invite link
- Accept invite (mock webhook)
- View active contacts
- Delete contact

// tests/e2e/sos-sending.spec.ts
- Send SOS to private chat
- Send SOS to group
- Handle no contacts error
- Handle unauthenticated user
```

### Manual Testing Checklist

- [ ] Register domain with @BotFather: `/setdomain yourapp.com`
- [ ] Add `TELEGRAM_BOT_USERNAME` to `.env`
- [ ] Test Telegram Login Widget in dev
- [ ] Generate invite link
- [ ] Send invite to private Telegram chat
- [ ] Click `/start` link in Telegram
- [ ] Verify bot confirmation message
- [ ] Check contact appears as "Active" in app
- [ ] Send invite to Telegram group
- [ ] Add bot to group and click `/start` link
- [ ] Verify group appears in contacts
- [ ] Trigger SOS with location
- [ ] Verify message sent to all contacts with real user name
- [ ] Test SOS button when not authenticated
- [ ] Test SOS API when no contacts configured
- [ ] Delete contact and verify SOS doesn't send

## Critical Files

1. `instant.schema.ts` - Schema changes (profiles + emergencyContacts)
2. `src/app/api/sos/route.ts` - SOS API refactor (remove device tokens, add user auth)
3. `src/app/api/telegram/webhook/route.ts` - Invite acceptance flow
4. `src/hooks/useSOS.ts` - SOS hook refactor (remove device tokens)
5. `src/app/[locale]/settings/contacts/page.tsx` - Contact management UI rewrite

## Risks & Mitigations

**Risk**: Users don't understand invite system
**Mitigation**: Clear visual instructions, QR code for easy sharing, example screenshots

**Risk**: Contacts don't click invite link
**Mitigation**: Show pending status, allow link regeneration, add expiration timer

**Risk**: Migration pushback from users
**Mitigation**: Clear communication of benefits (groups support, auto-names, more reliable)

**Risk**: Bot blocked by contact
**Mitigation**: Handle 403 errors gracefully, show "unreachable" status, offer re-invite

## Future Enhancements (Phase 2)

- SOS history tracking (`sosHistory` entity)
- Contact confirmation responses ("I'm on my way")
- Smart contact suggestions
- WhatsApp integration (if feasible)
- Telegram Web App mini-app (native contact picker)
