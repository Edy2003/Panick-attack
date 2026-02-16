# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PanicAttack Helper — free PWA for helping people with anxiety disorder during panic attacks. Voice AI assistant (CBT/grounding protocols), SOS button for alerting emergency contacts via Telegram/WhatsApp, breathing exercises, anxiety journal.

**PRD**: `docs/prd.md` | **Architecture**: `docs/architect.md` | **Tasks**: `docs/tasks.md`

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript strict mode
- **Styling**: Tailwind CSS 4 (CSS-first config, no tailwind.config file — uses `@theme inline` in `globals.css`) + shadcn/ui (new-york style)
- **Animations**: Framer Motion
- **State**: React local state + InstantDB real-time subscriptions. Zustand is installed but not yet used
- **i18n**: next-intl — Ukrainian (primary, `uk`), English (secondary, `en`). Translation files: `messages/uk.json`, `messages/en.json`
- **Database**: InstantDB (real-time, offline-first, built-in auth & permissions). Schema: `instant.schema.ts`, Permissions: `instant.perms.ts`
- **AI**: Google Gemini 2.0 Flash (gemini-2.0-flash-exp, FREE tier — 1500 req/day) via `/api/chat` route
- **Voice**: Web Speech API (SpeechRecognition for STT, SpeechSynthesis for TTS)
- **SOS Messaging**: Telegram Bot API (primary), Twilio WhatsApp Sandbox (secondary)
- **PWA**: Serwist (not yet configured — TASK-014)
- **Hosting**: Vercel (Free Hobby Plan)
- **Testing**: Vitest + React Testing Library + Playwright (deps installed, no configs or tests written yet)

## Commands

```bash
npm run dev              # Dev server (Turbopack)
npm run build            # Production build
npm run lint             # ESLint
npm run test             # Vitest unit tests (needs vitest.config.ts setup)
npm run test:e2e         # Playwright E2E (needs playwright.config.ts setup)
npx vitest run src/path/to/file.test.ts   # Run a single test file
```

## Code Architecture

### Routing & Layouts
All pages are locale-prefixed: `src/app/[locale]/`. The root layout (`src/app/layout.tsx`) sets Inter font (Latin + Cyrillic) and PWA metadata. The locale layout (`src/app/[locale]/layout.tsx`) wraps children in `NextIntlClientProvider` + `AppShell`. Middleware (`src/middleware.ts`) handles locale detection via next-intl, excluding `/api`, `/_next`, and static files.

**Pages**: home, auth, chat, exercises (breathing, grounding), journal, library (with `[slug]` dynamic), settings/contacts

### AppShell Layout
`AppShell` renders: `Header` (sticky top, glassmorphism) → `<main>` (with `pb-24` for bottom nav clearance) → `SOSButton` (fixed bottom-right, always visible) → `BottomNav` (fixed bottom, 5 tabs)

### Key Directories
```
src/
├── app/api/          # Route handlers: chat, sos, contacts, contacts/[id], telegram/webhook
├── components/       # Feature-grouped: auth, chat, exercises, journal, layout, library, sos, ui (shadcn)
├── hooks/            # useAuth, useChat, useSOS, useBreathingExercise, useGroundingExercise, useJournal, useSpeechRecognition, useSpeechSynthesis
├── lib/
│   ├── ai/           # chat-service, safety-filter, system-prompt
│   ├── auth/         # device-token (anonymous SOS auth via localStorage UUID)
│   ├── content/      # articles (6 articles × 2 languages, hardcoded)
│   ├── exercises/    # breathing-patterns (4 techniques with phase timings + colors)
│   ├── messaging/    # telegram, whatsapp, message-template
│   └── storage/      # journal (localStorage CRUD + CSV/JSON export)
├── i18n/             # routing.ts (locales config), request.ts (message loader)
└── types/            # speech.d.ts (Web Speech API types)
```

### Database (InstantDB)
- **Client**: `src/lib/db.ts` — `init()` from `@instantdb/react` with schema
- **Admin** (server-side): `src/lib/db-admin.ts` — `init()` from `@instantdb/admin`
- **Entities**: `$users`, `profiles`, `emergencyContacts`, `journalEntries`, `deviceTokens`
- **Links**: profileOwner (1:1), contactOwner (M:1), journalOwner (M:1)
- **Permissions**: CEL-based, `isOwner` pattern binding `auth.id in data.ref('owner.id')`
- Push schema/perms: `npx instant-cli push-schema` / `npx instant-cli push-perms`

### API Route Patterns
All routes use in-memory rate limiting (bounded Map, 10k entries max):
- `/api/chat`: 60 req/hr per IP, 30 messages/session, 500 char limit. Pre-send + post-receive safety filtering
- `/api/sos`: 5 req/10min per device token. Auth via `X-Device-Token` header. Contacts resolved server-side
- `/api/contacts`: CRUD for device token contacts. Max 10 per device
- `/api/telegram/webhook`: Verifies secret with timing-safe comparison. Links Telegram chatId on `/start` command

### Safety System
`src/lib/ai/safety-filter.ts` provides two-pass filtering:
1. **Pre-send** (`checkUserMessage`): crisis keyword detection (uk + en) → returns immediate crisis hotline response (7333 Лайфлайн Україна)
2. **Post-receive** (`checkAIResponse`): regex-based diagnosis/prescription detection → blocks with safe fallback

### i18n Pattern
Namespaces: `common`, `home`, `nav`, `sos`, `chat`, `settings`, `auth`, `exercises`, `breathing`, `journal`, `grounding`, `library`, `safety`. Usage: `const t = useTranslations("namespace"); t("key")`

### localStorage Keys
- `panic-helper:device-token` — anonymous device UUID for SOS
- `panic-helper:sos-queue` — offline SOS message queue
- `panic-helper:journal` — journal entries (array of JournalEntry)
- `panic-helper:bookmarks` — bookmarked article slugs

## Coding Conventions

- `@/` path alias → `src/`
- All user-facing strings via next-intl `useTranslations()` — never hardcode UI text
- Tailwind utility classes only, no inline styles. Use `cn()` from `@/lib/utils` for conditional classes
- Shadcn components in `src/components/ui/` — add new ones via `npx shadcn@latest add <component>`
- API routes as Next.js Route Handlers (`src/app/api/`)
- Accessibility: keyboard navigable, ARIA labels, `prefers-reduced-motion` support, 48×48px minimum tap targets
- Next.js 16 async params pattern: `const { locale } = await params` in layouts/pages

## Design System

### Colors (defined as CSS custom properties in `src/app/globals.css`)
```
--calm-blue:  #7CB9E8  — primary actions, breathing inhale
--lavender:   #B4A7D6  — breathing hold
--soft-green:  #A8D5BA  — breathing exhale
--peach:       #F4A896  — warm accent
--sos-red:     #DC2626  — SOS button only
```
Light background: `#FFF8F0` (creamy warm). Dark mode: `#1A1B2E` (deep navy) with glassmorphism cards (`backdrop-blur`).

### Typography
- Font: Inter (Latin + Cyrillic subsets)
- Body minimum 16px; during panic state minimum 24px
- Mobile-first responsive; SOS button always fixed-position visible

## Critical Safety Rules

1. **AI must NEVER diagnose or prescribe medication**
2. **Suicide/self-harm mentions → immediate crisis hotline: 7333 (Лайфлайн Україна)**
3. **AI tone: warm, calm, validating — never dismissive**
4. **SOS requires 3s countdown confirmation to prevent accidental triggers**
5. **No PHI/PII stored without explicit user consent**

## Phase Completion Workflow

**Before starting a new phase**: create a dedicated branch from `main` named `phase-N/short-description` (e.g. `phase-3/additional-features`).

After completing each phase (group of related TASKs), execute these steps **in order**:

1. **Update CLAUDE.md** — reflect new/changed architecture, commands, conventions, or localStorage keys introduced in this phase
2. **Run Bug Hunter** — follow `agents/bug-review.md` principles: full scan of all files changed in this phase. Classify findings S1–S4, fix all S1/S2 before proceeding
3. **Run Code Reviewer** — follow `agents/code-reviewer.md` principles: review via `git diff main...HEAD`, fix all Critical issues, address Warnings
4. **Merge to main** — after both reviews pass clean, merge the feature branch into `main`

## Agent Roles

Agent definition files in `agents/`. Read the full file for detailed principles:
- `full-stack.md` — system architecture, API contracts, DB schemas, security
- `designer.md` — UI design, components, accessibility, calming palette
- `prt-agent.md` — PRDs, task decomposition, sprint planning
- `code-reviewer.md` — code review checklist (Critical → Warnings → Suggestions)
- `bug-review.md` — bug hunting, severity S1–S4, full codebase scan
- `ml-engineer.md` — future ML features (panic detection, sentiment analysis)

## Environment Variables

```
NEXT_PUBLIC_INSTANT_APP_ID, INSTANT_ADMIN_TOKEN
GEMINI_API_KEY                  # Get from https://aistudio.google.com/apikey (FREE, 1500 req/day)
TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
```
