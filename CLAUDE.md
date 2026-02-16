# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PanicAttack Helper — free PWA for helping people with anxiety disorder during panic attacks. Voice AI assistant (CBT/grounding protocols), SOS button for alerting emergency contacts via Telegram, breathing exercises, anxiety journal.

**PRD**: `docs/prd.md` | **Architecture**: `docs/architect.md` | **Tasks**: `docs/tasks.md` | **SOS Redesign**: `docs/sos-redesign.md`

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript strict mode
- **Styling**: Tailwind CSS 4 (CSS-first config via `@theme inline` in `globals.css`) + shadcn/ui (new-york style)
- **Animations**: Framer Motion
- **State**: React local state + InstantDB real-time subscriptions
- **i18n**: next-intl — Ukrainian (primary, `uk`), English (secondary, `en`). Translation files: `messages/uk.json`, `messages/en.json`
- **Database**: InstantDB (real-time, offline-first, built-in auth & permissions). Schema: `instant.schema.ts`, Permissions: `instant.perms.ts`
- **Auth**: InstantDB email magic code authentication. Cookie-based API authentication via `getUnverifiedUserFromInstantCookie`
- **AI**: Google Gemini 2.5 Flash (gemini-2.5-flash, FREE tier — 1500 req/day) via `/api/chat` route
- **Voice**: Web Speech API (SpeechRecognition for STT, SpeechSynthesis for TTS)
- **SOS Messaging**: Telegram Bot API with invite-based contact system
- **PWA**: Serwist (not yet configured)
- **Hosting**: Vercel (Free Hobby Plan)

## Commands

```bash
npm run dev              # Dev server (Turbopack)
npm run build            # Production build
npm run lint             # ESLint
npx instant-cli push schema --yes    # Push schema changes
npx instant-cli push perms --yes     # Push permission changes
```

## Code Architecture

### Routing & Layouts
All pages are locale-prefixed: `src/app/[locale]/`. Middleware (`src/middleware.ts`) handles locale detection via next-intl.

**Pages**: home, auth, chat, exercises (breathing, grounding), journal, library (with `[slug]` dynamic), settings/contacts

### AppShell Layout
`Header` (sticky top, glassmorphism, language toggle + profile icon) → `<main>` (pb-24) → `SOSButton` (fixed bottom-right) → `BottomNav` (fixed bottom, 5 tabs)

### Key Directories
```
src/
├── app/api/          # chat, sos, contacts/invite, auth/telegram/connect, telegram/webhook
├── components/       # Feature-grouped: auth, chat, exercises, journal, layout, library, sos, ui
├── hooks/            # useAuth, useChat, useSOS, useBreathingExercise, useGroundingExercise, useJournalDB, useSpeech*
├── lib/
│   ├── ai/           # chat-service, safety-filter, system-prompt
│   ├── auth/         # get-auth-user (cookie-based API auth), telegram-auth (hash verification)
│   ├── content/      # articles (6 articles × 2 languages, hardcoded)
│   ├── exercises/    # breathing-patterns (4 techniques)
│   ├── messaging/    # telegram, message-template
│   └── storage/      # journal (localStorage CRUD + CSV/JSON export)
└── i18n/             # routing.ts, request.ts
```

### Database (InstantDB)
- **Client**: `src/lib/db.ts` — `init()` from `@instantdb/react`
- **Admin**: `src/lib/db-admin.ts` — `init()` from `@instantdb/admin`
- **Entities**:
  - `$users` — InstantDB managed users
  - `profiles` — displayName, language, isGuest, Telegram OAuth fields (telegramUserId, telegramUsername, telegramFirstName, telegramPhotoUrl, telegramAuthDate)
  - `emergencyContacts` — displayName, telegramChatId, telegramChatType, telegramChatTitle, telegramChatPhoto, inviteToken, invitedAt, acceptedAt, isActive
  - `journalEntries` — anxietyLevel, triggers, symptoms, copingTechniques, durationMinutes (optional), notes (optional), createdAt
- **Links**: profileOwner (1:1), contactOwner (M:1), journalOwner (M:1)
- **Permissions**: CEL-based, `isOwner` pattern: `auth.id in data.ref('owner.id')`

### Authentication

**Client-side**: Email magic code via `db.useAuth()` hook
- `sendMagicCode(email)` → `signInWithMagicCode(email, code)`
- Profile icon in Header links to `/auth` page

**Server-side (API routes)**: Cookie-based authentication
```typescript
import { getAuthenticatedUser } from "@/lib/auth/get-auth-user";

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request); // Gets user from secure cookies
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = user.id; // Now you have verified user ID
  // ... rest of logic
}
```

**CRITICAL**: NEVER accept `X-Instant-User-Id` or similar headers from client. Always use `getAuthenticatedUser()` for API route authentication.

**Client fetch calls**: Always include `credentials: "include"` to send cookies:
```typescript
fetch("/api/endpoint", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include", // Required for cookie-based auth
  body: JSON.stringify(data),
});
```

### SOS System Architecture
**Full design**: See `docs/sos-redesign.md`

**Flow**:
1. User authenticates via email magic code
2. User generates unique invite link → shares to Telegram chats (private or groups)
3. Recipients click invite → bot captures chat_id + metadata via `/start <token>` command
4. SOS triggered → bot sends to all linked chat_ids

**Features**: Invite-based (no chat list selection), supports private + groups, QR codes, max 10 contacts/user

### API Routes

All routes use in-memory rate limiting (bounded Map, 10k entries max):

- **`/api/chat`**: 60 req/hr per IP, 30 msg/session, 500 char limit. Safety filtering (pre-send + post-receive)
- **`/api/sos`**: 5 req/10min per user. Cookie auth. Queries user's emergencyContacts, sends to all active telegramChatIds
- **`/api/contacts/invite`**: POST generates unique inviteToken, creates pending contact, returns deep link (`t.me/bot?start=token`)
- **`/api/auth/telegram/connect`**: POST verifies Telegram Login Widget hash (HMAC-SHA256), updates user profile with Telegram data
- **`/api/telegram/webhook`**: Verifies secret (timing-safe comparison). On `/start <token>`, finds contact by inviteToken, captures chat metadata, marks accepted

### Safety System
`src/lib/ai/safety-filter.ts`:
1. **Pre-send** (`checkUserMessage`): Crisis keyword detection (uk + en) → immediate crisis hotline (7333 Лайфлайн Україна)
2. **Post-receive** (`checkAIResponse`): Regex-based diagnosis/prescription detection → blocks with fallback

### i18n Pattern
Namespaces: `common`, `home`, `nav`, `sos`, `chat`, `settings`, `auth`, `exercises`, `breathing`, `journal`, `grounding`, `library`, `safety`

Usage: `const t = useTranslations("namespace"); t("key")`

### localStorage Keys
- `panic-helper:journal` — journal entries (migrated to InstantDB on first auth)
- `panic-helper:bookmarks` — bookmarked article slugs

## Coding Conventions

- `@/` path alias → `src/`
- All user-facing strings via next-intl `useTranslations()` — NEVER hardcode UI text
- Tailwind utility classes only, no inline styles. Use `cn()` from `@/lib/utils` for conditional classes
- Shadcn components in `src/components/ui/` — add via `npx shadcn@latest add <component>`
- API routes as Next.js Route Handlers (`src/app/api/`)
- Accessibility: keyboard navigable, ARIA labels, `prefers-reduced-motion`, 48×48px tap targets
- Next.js 16 async params: `const { locale } = await params` in layouts/pages

## Design System

### Colors (CSS custom properties in `src/app/globals.css`)
```
--calm-blue:   #7CB9E8  — primary, breathing inhale
--lavender:    #B4A7D6  — breathing hold
--soft-green:  #A8D5BA  — breathing exhale
--peach:       #F4A896  — warm accent
--sos-red:     #DC2626  — SOS button only
```
Light: `#FFF8F0` (creamy warm) | Dark: `#1A1B2E` (deep navy) + glassmorphism

### Typography
- Font: Inter (Latin + Cyrillic)
- Body: 16px minimum; panic state: 24px minimum
- Mobile-first responsive

## Critical Safety Rules

1. **AI must NEVER diagnose or prescribe medication**
2. **Suicide/self-harm mentions → immediate crisis hotline: 7333 (Лайфлайн Україна)**
3. **AI tone: warm, calm, validating — never dismissive**
4. **SOS requires 3s countdown confirmation**
5. **No PHI/PII stored without explicit consent**

## Phase Completion Workflow

Before starting a phase: create branch `phase-N/short-description`

After completing phase:
1. **Update CLAUDE.md** — new architecture, commands, conventions
2. **Run Bug Hunter** — `agents/bug-review.md` principles, fix S1/S2
3. **Run Code Reviewer** — `agents/code-reviewer.md` principles, fix Critical issues
4. **Merge to main** — after reviews pass

## Agent Roles

See `agents/` directory:
- `full-stack.md` — architecture, API contracts, security
- `designer.md` — UI/UX, accessibility, calming palette
- `prt-agent.md` — PRDs, task decomposition
- `code-reviewer.md` — code review checklist
- `bug-review.md` — bug hunting, severity classification
- `ml-engineer.md` — future ML features

## Environment Variables

```bash
NEXT_PUBLIC_INSTANT_APP_ID=          # InstantDB app ID
INSTANT_ADMIN_TOKEN=                 # InstantDB admin token (server-side only)
GEMINI_API_KEY=                      # Get from https://aistudio.google.com/apikey
TELEGRAM_BOT_TOKEN=                  # Telegram Bot API token
TELEGRAM_WEBHOOK_SECRET=             # Secret for webhook verification
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=   # Bot username without @ (for Login Widget + invite links)
```

## InstantDB Resources

For InstantDB usage, query patterns, permissions, and best practices, see:
- **Documentation**: https://instantdb.com/docs
- **Common mistakes**: https://instantdb.com/docs/common-mistakes
- **Schema modeling**: https://instantdb.com/docs/modeling-data
- **Queries (InstaQL)**: https://instantdb.com/docs/instaql
- **Transactions (InstaML)**: https://instantdb.com/docs/instaml
- **Permissions**: https://instantdb.com/docs/permissions
- **Backend/Admin SDK**: https://instantdb.com/docs/backend
- **CLI**: https://instantdb.com/docs/cli

**Key reminders**:
- Pass `schema` when calling `init()` for type safety
- Use `id()` from `@instantdb/react` or `@instantdb/admin` to generate entity IDs
- Index any field you filter/order by in schema
- `data.ref()` always returns a list and must end with an attribute
- Follow rules of hooks — no conditional `db.useQuery()` calls
