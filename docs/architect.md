# Architecture — PanicAttack Helper

Version: 1.0
Updated: 2026-02-15
PRD Reference: `docs/prd.md`

---

## 1. System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      CLIENT (PWA)                            │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐ │
│  │ Voice Chat │  │ Breathing  │  │ Grounding 5-4-3-2-1    │ │
│  │ (STT/TTS)  │  │ Exercises  │  │                        │ │
│  └─────┬──────┘  └────────────┘  └────────────────────────┘ │
│        │                                                     │
│  ┌─────┴──────┐  ┌────────────┐  ┌────────────────────────┐ │
│  │ SOS Button │  │  Anxiety   │  │ Articles Library       │ │
│  │ (fixed)    │  │  Journal   │  │ (MDX)                  │ │
│  └─────┬──────┘  └─────┬──────┘  └────────────────────────┘ │
│        │               │                                     │
│  ┌─────┴───────────────┴─────────────────────────────────┐  │
│  │  Zustand Store │ localStorage │ Serwist Service Worker │  │
│  └───────────────────────┬───────────────────────────────┘  │
└──────────────────────────┼───────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────┼───────────────────────────────────┐
│             VERCEL SERVERLESS (Next.js API Routes)           │
│                                                              │
│  ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │/api/chat │ │/api/sos │ │/api/     │ │/api/telegram/    │ │
│  │          │ │         │ │journal   │ │webhook           │ │
│  │          │ │         │ │contacts  │ │                  │ │
│  └────┬─────┘ └────┬────┘ └────┬─────┘ └────────┬─────────┘ │
│       │            │           │                 │           │
│  ┌────┴────┐  ┌────┴────┐  ┌──┴───┐  ┌──────────┴─────┐    │
│  │Rate     │  │Device   │  │Auth  │  │Link Token      │    │
│  │Limiter  │  │Token    │  │Check │  │Resolver        │    │
│  │         │  │Validator│  │      │  │                │    │
│  └────┬────┘  └────┬────┘  └──┬───┘  └──────────┬─────┘    │
└───────┼────────────┼──────────┼──────────────────┼──────────┘
        │            │          │                  │
  ┌─────┴─────┐  ┌───┴──────────┴───┐  ┌──────────┴─────────┐
  │ Anthropic │  │    Supabase      │  │  Telegram Bot API   │
  │ Claude    │  │ PostgreSQL + Auth│  │  Twilio WhatsApp    │
  │ API       │  │ + RLS            │  │                     │
  └───────────┘  └──────────────────┘  └─────────────────────┘
```

---

## 2. Frontend Architecture

### 2.1 Next.js App Router Structure

```
src/app/
├── layout.tsx              ← Root: providers (i18n, auth, Zustand, theme)
├── page.tsx                ← Homepage: quick access to chat, exercises, SOS
├── chat/page.tsx           ← Voice AI chat
├── exercises/
│   ├── breathing/page.tsx  ← Breathing exercises (4 techniques)
│   └── grounding/page.tsx  ← 5-4-3-2-1 grounding wizard
├── journal/
│   ├── page.tsx            ← Journal list + charts
│   ├── new/page.tsx        ← Quick log form
│   └── [id]/page.tsx       ← Entry detail/edit
├── library/
│   ├── page.tsx            ← Articles listing + search
│   └── [slug]/page.tsx     ← Article detail (MDX)
├── settings/
│   └── contacts/page.tsx   ← Emergency contacts management
├── auth/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── callback/route.ts   ← OAuth callback
├── offline/page.tsx         ← Offline fallback
└── api/                     ← See section 4 (API Layer)
```

### 2.2 Component Hierarchy

```
AppShell (layout wrapper)
├── Header (navigation, language switcher)
├── SOSButton (fixed position, always visible on all screens)
├── BottomNav (mobile: Home, Chat, Exercises, Journal, Library)
├── OfflineBanner (conditionally shown when offline)
└── {Page Content}
    ├── VoiceChat
    │   ├── ChatBubble[]
    │   └── VoiceButton (push-to-talk / toggle)
    ├── BreathingCircle (Framer Motion animated)
    │   ├── BreathingTimer
    │   └── ExerciseSelector
    ├── GroundingWizard
    │   ├── GroundingStep (x5)
    │   └── ProgressBar
    ├── QuickLogForm
    │   ├── TriggerSelector
    │   └── AnxietyChart
    └── ArticleCard[] / SearchBar
```

### 2.3 State Management

```
┌─────────────────────────────────────────────────┐
│               Zustand Stores (global)           │
│                                                 │
│  authStore      │ user, isAuthenticated, login  │
│  chatStore      │ messages, sessionId, status   │
│  sosStore       │ contacts, sendStatus, queue   │
│  settingsStore  │ language, userName, theme     │
│  offlineStore   │ isOnline, queuedActions      │
└─────────────┬───────────────────────────────────┘
              │ persist to
              ▼
┌─────────────────────────────────────────────────┐
│             localStorage                        │
│                                                 │
│  panic-helper:contacts   → EmergencyContact[]   │
│  panic-helper:journal    → JournalEntry[]       │
│  panic-helper:settings   → { language, name }   │
│  panic-helper:chat       → ChatSession | null   │
│  panic-helper:sos-queue  → SOSQueueItem[]       │
│  panic-helper:device-token → string             │
│  panic-helper:version    → number (schema ver)  │
└─────────────────────────────────────────────────┘
```

**Rules**:
- Zustand stores for runtime state, React state (`useState`) for component-local UI state
- localStorage is the source of truth for unauthenticated users
- When authenticated, Supabase is source of truth; localStorage acts as cache/fallback
- `panic-helper:version` enables future localStorage schema migrations

### 2.4 i18n Architecture

```
middleware.ts (composable)
├── detectLocale()     ← cookie → Accept-Language → default 'uk'
└── authCheck()        ← added by TASK-009, checks Supabase session

messages/
├── uk.json            ← Ukrainian (primary, complete)
└── en.json            ← English (secondary, complete)

Usage in components:
  const t = useTranslations('chat');
  t('greeting')  → "Привіт, як я можу допомогти?"
```

**Key rule**: All user-facing strings go through `useTranslations()`. No hardcoded text in components. The AI assistant's language matches the UI language — passed via `language` param in `/api/chat`.

---

## 3. Voice AI Pipeline

### 3.1 Flow Diagram

```
┌──────────┐     ┌──────────────┐     ┌───────────┐     ┌──────────┐
│  User    │────▶│ Web Speech   │────▶│ /api/chat │────▶│ Claude   │
│  speaks  │     │ API (STT)    │     │           │     │ API      │
└──────────┘     │ Ukrainian/En │     │ + history │     │ (Sonnet) │
                 └──────────────┘     └───────────┘     └────┬─────┘
                                                             │
┌──────────┐     ┌──────────────┐     ┌───────────┐         │
│  User    │◀────│ Web Speech   │◀────│ Response  │◀────────┘
│  hears   │     │ API (TTS)    │     │ text      │
└──────────┘     └──────────────┘     └───────────┘
```

### 3.2 System Prompt Architecture

```
src/lib/ai/
├── system-prompt.ts    ← Base prompt: CBT, grounding, breathing protocols
├── chat-service.ts     ← Anthropic SDK wrapper, message formatting
└── safety-filter.ts    ← Pre-send + post-receive crisis keyword detection
```

**System prompt layers**:
1. **Role definition** — compassionate mental health support assistant
2. **Knowledge base** — CBT, 5-4-3-2-1 grounding, 4-7-8/box breathing, PMR, mindfulness
3. **Response rules** — short (2-3 sentences during acute panic), warm tone, validate first
4. **Hard constraints** — never diagnose, never prescribe, always provide hotline for crisis
5. **Language instruction** — respond in user's language (uk/en)

### 3.3 Safety Filter

```
User message
    │
    ▼
┌──────────────────────────────┐
│  PRE-SEND FILTER             │
│  Check for crisis keywords:  │
│  суїцид, самогубство,        │
│  suicide, self-harm, kill    │
│  myself, не хочу жити...     │
└──────────┬───────────────────┘
           │
     ┌─────┴─────┐
     │ Crisis?   │
     └─────┬─────┘
       yes │         no
     ┌─────▼─────┐  ┌────▼─────┐
     │ BYPASS AI │  │ Send to  │
     │ Show:     │  │ Claude   │
     │ 7333      │  │ API      │
     │ hotline   │  └────┬─────┘
     │ directly  │       │
     └───────────┘  ┌────▼──────────────┐
                    │ POST-RECEIVE      │
                    │ FILTER            │
                    │ Verify no medical │
                    │ diagnoses in      │
                    │ response          │
                    └───────────────────┘
```

### 3.4 Fallback Chain

| Condition | Fallback |
|-----------|----------|
| Browser lacks STT | Text input field shown |
| STT fails (noise/error) | "Не розчув, спробуйте ще" + text input |
| TTS unavailable | Show response as text on screen |
| Claude API timeout/error | Retry once → show static calming message |
| Offline | Static calming script from `chat-fallback.ts` (no AI) |

### 3.5 Rate Limits

| Limit | Value | Scope |
|-------|-------|-------|
| Messages per session | 30 | per sessionId |
| Sessions per hour | 10 | per IP |
| Input tokens per request | 1,000 | per request |
| Output tokens per response | 300 | per request |
| History context window | 20 messages | client-managed |

---

## 4. API Layer

### 4.1 Route Map

```
src/app/api/
├── chat/route.ts                    POST   — Voice AI chat
├── sos/route.ts                     POST   — Send SOS to contacts
├── telegram/webhook/route.ts        POST   — Telegram bot callback
├── journal/
│   ├── route.ts                     GET, POST
│   └── [id]/route.ts               PUT, DELETE
└── contacts/
    ├── route.ts                     GET, POST
    └── [id]/route.ts               PUT, DELETE
```

### 4.2 Authentication Strategy

Two parallel auth modes, both fully functional:

```
Request arrives
    │
    ▼
┌──────────────────────┐
│ Check Authorization  │
│ header (Supabase)    │
└──────────┬───────────┘
     ┌─────┴─────┐
     │ Has valid  │
     │ session?   │
     └─────┬─────┘
    yes    │      no
  ┌────────▼──┐  ┌────▼──────────────┐
  │ Auth mode │  │ Check X-Device-   │
  │ user_id   │  │ Token header      │
  │ from JWT  │  └────────┬──────────┘
  │           │      ┌────┴─────┐
  │ Query     │      │ Valid    │
  │ Supabase  │      │ token?   │
  │ with RLS  │      └────┬────┘
  └───────────┘   yes     │     no
              ┌───────────▼──┐  ┌──▼──────┐
              │ Anon mode    │  │ 401     │
              │ resolve from │  │ Error   │
              │ device_tokens│  └─────────┘
              │ table        │
              └──────────────┘
```

### 4.3 Error Response Contract

All endpoints return errors in a unified format:

```typescript
interface APIError {
  error: {
    code: string;     // e.g. "RATE_LIMIT_EXCEEDED", "INVALID_TOKEN"
    message: string;  // human-readable, localized
  }
}
```

### 4.4 SOS Security Model

```
Device first setup:
  1. Client generates UUID device token
  2. POST /api/contacts with X-Device-Token → creates device_tokens row
  3. Token stored in localStorage (panic-helper:device-token)

SOS send:
  1. POST /api/sos with X-Device-Token + optional location
  2. Server resolves contacts from device_tokens.contacts (anon) or emergency_contacts (auth)
  3. Contacts are NEVER passed in request body
  4. Rate limit: 5 requests / 10 min per token
```

---

## 5. Database Architecture

### 5.1 Entity Relationship Diagram

```
auth.users (Supabase managed)
    │ 1
    │
    │ on_auth_user_created trigger
    ▼
┌──────────────┐       ┌────────────────────┐
│  profiles    │──1:N──│ emergency_contacts  │
│──────────────│       │────────────────────│
│ id (PK, FK)  │       │ id (PK)            │
│ display_name │       │ user_id (FK)       │
│ language     │       │ name               │
│ created_at   │       │ telegram_chat_id   │
│ updated_at ● │       │ telegram_username  │
└──────┬───────┘       │ telegram_link_token│
       │               │ whatsapp_number    │
       │ 1:N           │ is_active          │
       │               │ created_at         │
       ▼               │ updated_at ●       │
┌──────────────┐       └────────────────────┘
│journal_entries│
│──────────────│       ┌────────────────────┐
│ id (PK)      │       │  device_tokens     │
│ user_id (FK) │       │────────────────────│
│ anxiety_level│       │ id (PK)            │
│ triggers[]   │       │ token (UNIQUE)     │
│ symptoms[]   │       │ contacts (JSONB)   │
│ coping_tech[]│       │ created_at         │
│ duration_min │       └────────────────────┘
│ notes        │
│ created_at   │       ● = auto-updated via trigger
└──────────────┘
```

### 5.2 Row Level Security

| Table | Policy | Rule |
|-------|--------|------|
| profiles | SELECT own | `auth.uid() = id` |
| profiles | UPDATE own | `auth.uid() = id` |
| emergency_contacts | ALL own | `auth.uid() = user_id` |
| journal_entries | ALL own | `auth.uid() = user_id` |
| device_tokens | — | Accessed via `service_role` key only (API routes) |

### 5.3 Database Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `update_updated_at()` | BEFORE UPDATE on profiles, emergency_contacts | Auto-set `updated_at = NOW()` |
| `handle_new_user()` | AFTER INSERT on auth.users | Auto-create profiles row with default `language='uk'` |

---

## 6. SOS Messaging Architecture

### 6.1 Telegram Deep Link Onboarding

```
User adds contact         Contact receives link       Bot receives /start
in app                    via SMS/messenger
    │                         │                            │
    ▼                         ▼                            ▼
┌─────────────┐         ┌─────────────┐         ┌──────────────────┐
│ Generate    │         │ Click       │         │ /api/telegram/   │
│ link_token  │─ send ─▶│ t.me/Bot?   │────────▶│ webhook          │
│ Save to DB  │  link   │ start=TOKEN │         │                  │
└─────────────┘         └─────────────┘         │ Resolve token →  │
                                                │ Save chat_id →   │
                                                │ Send confirm msg │
                                                └──────────────────┘
UI polls status:
  "Очікує підключення" → "Підключено ✓"
```

### 6.2 SOS Send Flow

```
SOS Button pressed
    │
    ▼
3-second countdown (can cancel)
    │ confirmed
    ▼
┌───────────────────┐     ┌──────────────────┐
│ Online?           │─no─▶│ Queue in         │
│                   │     │ IndexedDB        │
└────────┬──────────┘     │ (sos-queue)      │
         │ yes            │ Send on reconnect│
         ▼                └──────────────────┘
┌───────────────────┐
│ POST /api/sos     │
│ X-Device-Token    │
│ + location?       │
└────────┬──────────┘
         │
    ┌────┴────┐
    │ Server  │
    │ resolves│
    │ contacts│
    └────┬────┘
         │
    ┌────┴─────────────┐
    │  For each contact │
    ├──────────────────┤
    │  telegram_chat_id │──▶ Telegram Bot API sendMessage
    │  whatsapp_number  │──▶ Twilio WhatsApp API
    └──────────────────┘
         │
         ▼
    Results: [{ contactId, channel, status: 'sent'|'failed' }]
```

### 6.3 Message Template

```
🆘 SOS — {userName}

{userName} повідомляє: "У мене панічна атака, мені потрібна підтримка."

📍 Локація: {googleMapsLink}  (if location shared)
🕐 Час: {timestamp}

Цей контакт налаштований як екстрений у застосунку PanicAttack Helper.
```

---

## 7. Offline Architecture (PWA)

### 7.1 Serwist Caching Strategy

| Resource | Strategy | Reason |
|----------|----------|--------|
| App shell (HTML, JS, CSS) | Cache First | Must work offline instantly |
| Breathing/grounding pages | Cache First | Critical for offline panic support |
| MDX articles | Stale While Revalidate | Content rarely changes |
| `/api/chat` | Network Only | AI requires server |
| `/api/sos` | Network Only | Messaging requires server |
| Fonts, icons | Cache First | Static assets |
| Sounds (breathing audio) | Cache First | Exercise audio |

### 7.2 Offline Feature Matrix

| Feature | Offline? | Fallback |
|---------|----------|----------|
| Breathing exercises | Full | — |
| Grounding 5-4-3-2-1 | Full | — |
| Voice AI chat | No | Static calming script (`chat-fallback.ts`) |
| SOS button | Partial | Message queued in IndexedDB, sent on reconnect |
| Anxiety journal | Read: yes | Write: queued locally, synced on reconnect |
| Articles library | Yes | Cached via Serwist |
| Auth | No | Continue as anonymous |

### 7.3 SOS Offline Queue

```typescript
interface SOSQueueItem {
  id: string;
  location?: { lat: number; lng: number };
  timestamp: Date;
  retryCount: number;
  maxRetries: 3;
}

// Stored in: localStorage (panic-helper:sos-queue)
// On reconnect: service worker triggers flush
// Failed after 3 retries: show error to user
```

---

## 8. Security Architecture

### 8.1 Layers

```
┌─────────────────────────────────────────┐
│ Layer 1: Transport — HTTPS (Vercel TLS) │
├─────────────────────────────────────────┤
│ Layer 2: Headers                        │
│   CSP, X-Frame-Options, HSTS           │
│   Referrer-Policy, Permissions-Policy   │
├─────────────────────────────────────────┤
│ Layer 3: Rate Limiting                  │
│   /api/chat: 10 sessions/hr per IP     │
│   /api/sos: 5 requests/10min per token │
│   /api/*: general 100 req/min per IP   │
├─────────────────────────────────────────┤
│ Layer 4: Authentication                 │
│   Supabase JWT (auth mode)             │
│   Device token (anonymous mode)         │
├─────────────────────────────────────────┤
│ Layer 5: Authorization                  │
│   Supabase RLS (row-level security)     │
│   service_role for device_tokens only   │
├─────────────────────────────────────────┤
│ Layer 6: Input Validation               │
│   Zod schemas on all API inputs         │
│   Max message length: 500 chars         │
│   Max history: 20 messages              │
├─────────────────────────────────────────┤
│ Layer 7: AI Safety                      │
│   Pre-send crisis keyword filter        │
│   Post-receive diagnosis filter         │
│   System prompt hard constraints        │
└─────────────────────────────────────────┘
```

### 8.2 Environment Secrets

All secrets stored in Vercel Environment Variables, never in code:

| Variable | Used by | Scope |
|----------|---------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Secret |
| `ANTHROPIC_API_KEY` | Server only | Secret |
| `TELEGRAM_BOT_TOKEN` | Server only | Secret |
| `TELEGRAM_WEBHOOK_SECRET` | Server only | Secret |
| `TWILIO_ACCOUNT_SID` | Server only | Secret |
| `TWILIO_AUTH_TOKEN` | Server only | Secret |
| `TWILIO_WHATSAPP_FROM` | Server only | Secret |

### 8.3 CORS

- Restricted to own domain only (Vercel default)
- Telegram webhook: validate `X-Telegram-Bot-Api-Secret-Token` header

---

## 9. Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint | < 1.5s | Lighthouse |
| Largest Contentful Paint | < 2.5s | Lighthouse |
| Time to Interactive | < 3s | Lighthouse |
| Voice response latency (STT → API → TTS) | < 3s | Custom metric |
| SOS message delivery | < 5s | API response time |
| Lighthouse Performance | > 90 | Lighthouse CI |
| Lighthouse Accessibility | > 95 | Lighthouse CI |
| Lighthouse PWA | 100 | Lighthouse CI |
| Bundle size (initial JS) | < 150KB gzipped | Build output |

### Optimization strategies:
- Next.js App Router with streaming SSR
- Dynamic imports for heavy components (BreathingCircle, AnxietyChart)
- Edge Runtime for latency-critical routes (`/api/chat`, `/api/sos`)
- Serwist precaching for offline-critical assets
- `prefers-reduced-motion` disables Framer Motion animations

---

## 10. Deployment Architecture

```
GitHub (main branch)
    │
    │ push / PR merge
    ▼
┌──────────────────┐
│ Vercel CI/CD     │
│ Auto-deploy      │
│                  │
│ Build: next build│
│ Lint: eslint     │
│ Test: vitest     │
└────────┬─────────┘
         │
    ┌────┴─────┐
    │ Preview  │ ← PR branches
    │ deploy   │
    └──────────┘
    ┌────┴─────┐
    │Production│ ← main branch
    │ deploy   │
    └──────────┘

External services (configured once):
  Supabase project  ← DB + Auth
  Telegram Bot      ← @BotFather, webhook URL = {VERCEL_URL}/api/telegram/webhook
  Twilio account    ← WhatsApp sandbox
```

---

## 11. Module Dependency Map

```
src/lib/
├── ai/
│   ├── system-prompt.ts     ← Pure data, no deps
│   ├── safety-filter.ts     ← Pure functions, no deps
│   └── chat-service.ts      ← depends on: @anthropic-ai/sdk, system-prompt, safety-filter
│
├── messaging/
│   ├── telegram.ts          ← depends on: TELEGRAM_BOT_TOKEN env
│   ├── whatsapp.ts          ← depends on: twilio env vars
│   └── message-template.ts  ← depends on: messages/ (i18n)
│
├── supabase/
│   ├── client.ts            ← Browser Supabase client (NEXT_PUBLIC_ vars)
│   └── server.ts            ← Server Supabase client (service_role key)
│
├── storage/
│   ├── contacts.ts          ← localStorage CRUD for contacts
│   └── journal.ts           ← localStorage CRUD for journal
│
├── auth/
│   └── device-token.ts      ← Token generation + validation via Supabase
│
├── exercises/
│   └── breathing-patterns.ts ← Pure config data (timings, phases, colors)
│
├── content/
│   └── articles.ts          ← MDX loading utilities
│
├── offline/
│   ├── sos-queue.ts         ← IndexedDB/localStorage queue management
│   └── chat-fallback.ts     ← Static calming script strings
│
└── fonts.ts                 ← Font configuration

src/hooks/
├── useSpeechRecognition.ts  ← Web Speech API STT wrapper
├── useSpeechSynthesis.ts    ← Web Speech API TTS wrapper
├── useChat.ts               ← depends on: chatStore, /api/chat
├── useSOS.ts                ← depends on: sosStore, /api/sos, sos-queue
├── useAuth.ts               ← depends on: authStore, supabase/client
├── useBreathingExercise.ts  ← depends on: breathing-patterns
├── useGroundingExercise.ts  ← Pure state machine
├── useJournal.ts            ← depends on: journalStore, /api/journal, storage/journal
└── useOffline.ts            ← navigator.onLine + service worker events
```
