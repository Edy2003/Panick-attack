# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PanicAttack Helper — free PWA for helping people with anxiety disorder during panic attacks. Voice AI assistant (CBT/grounding protocols), SOS button for alerting emergency contacts via Telegram/WhatsApp, breathing exercises, anxiety journal.

**PRD**: `docs/prd.md`
**Architecture**: `docs/architect.md`
**Task Assignments**: `docs/tasks.md`

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript strict mode
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Animations**: Framer Motion
- **State**: Zustand (global), React state (local)
- **i18n**: next-intl — Ukrainian (primary), English (secondary)
- **Database**: InstantDB (real-time, offline-first, built-in auth & permissions)
- **AI**: Anthropic Claude API (Sonnet) via Next.js API routes
- **Voice**: Web Speech API (SpeechRecognition for STT, SpeechSynthesis for TTS)
- **SOS Messaging**: Telegram Bot API (primary), Twilio WhatsApp Sandbox (secondary)
- **PWA**: Serwist (Service Worker, replaces deprecated next-pwa)
- **Hosting**: Vercel (Free Hobby Plan)
- **Testing**: Vitest + React Testing Library + Playwright

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright E2E tests
```

## Architecture

Full architecture with diagrams: `docs/architect.md`

Key decisions summarized here:

- **Voice AI**: STT → `/api/chat` (Claude Sonnet, max 300 output tokens) → TTS. Safety filter intercepts crisis keywords before AI. Fallback chain: STT fail → text input, TTS fail → text display, offline → static calming script
- **Auth**: InstantDB built-in auth (Magic Code + Google OAuth). Device tokens via admin SDK for anonymous SOS
- **SOS security**: contacts resolved server-side (never in request body), rate-limited 5 req/10min per token. Telegram onboarding via deep link + webhook
- **Offline (Serwist)**: Cache First for exercises/articles, Network Only for AI/SOS. Offline SOS queued in localStorage, flushed on reconnect
- **State**: Zustand stores for UI state. InstantDB handles data persistence, real-time sync, and offline cache automatically
- **Schema**: `instant.schema.ts` (entities + links), `instant.perms.ts` (CEL-based permissions). Push via `npx instant-cli push schema/perms`
- **Middleware**: locale detection in `middleware.ts` (TASK-004). Auth handled client-side by InstantDB `db.useAuth()`

## Coding Conventions

- Use `@/` path alias for `src/` imports
- All user-facing strings via next-intl `useTranslations()` — never hardcode UI text
- Tailwind utility classes only, no inline styles
- API routes as Next.js Route Handlers (`app/api/`)
- Accessibility: keyboard navigable, ARIA labels, `prefers-reduced-motion` support
- Large tap targets (48x48px minimum)

## Design System

### Colors (Calming Palette)
```
Primary (Calm Blue):  #7CB9E8  — actions, breathing inhale
Secondary (Lavender): #B4A7D6  — breathing hold
Background:           #FAF9F6  — warm white
Success (Soft Green): #A8D5BA  — breathing exhale
Text Primary:         #2D3748
SOS Red:              #DC2626  — SOS button only
```

### Typography
- Body minimum 16px; during panic state minimum 24px
- Mobile-first responsive; SOS button always fixed-position visible

## Critical Safety Rules

1. **AI must NEVER diagnose or prescribe medication**
2. **Suicide/self-harm mentions → immediate crisis hotline: 7333 (Лайфлайн Україна)**
3. **AI tone: warm, calm, validating — never dismissive**
4. **SOS requires 3s countdown confirmation to prevent accidental triggers**
5. **No PHI/PII stored without explicit user consent**

## Agent Roles

Agent definition files live in `agents/`. Follow the corresponding agent's principles and approach depending on the task context:

### `agents/full-stack.md` — Full-Stack Architect
**When**: designing system architecture, API contracts, database schemas, frontend-backend integration, performance/security decisions.
- Apply separation of concerns, SOLID, 12-Factor App principles
- Create architecture diagrams, API specifications, ERDs
- Evaluate technical feasibility and suggest optimal approaches
- Consider scalability, caching strategies, and observability
- Define clear interfaces between layers (frontend ↔ API ↔ DB ↔ external services)

### `agents/ml-engineer.md` — ML Engineer
**When**: adding ML-powered features (e.g. future panic detection from wearables, AI personalization, sentiment analysis, model fine-tuning).
- Start with baseline models, track all experiments
- Design reproducible ML pipelines with proper validation
- Plan model serving (REST API, containerized, or serverless)
- Consider model compression/quantization for edge deployment
- Monitor production model performance and drift detection
- Automate retraining triggers

### `agents/prt-agent.md` — Planning & PRD Agent
**When**: creating PRDs, breaking down requirements, estimating effort, planning sprints, task decomposition.
- Start with clarification questions before making assumptions
- Apply detailed dependency reasoning and critical path analysis
- Generate PRD files (`docs/prd.md`) + task assignments (`docs/tasks.md`)
- Every task must have: type, dependencies, acceptance criteria, files to create
- Identify parallel work streams and flag bottleneck dependencies

### `agents/designer.md` — UI Designer
**When**: creating UI, designing components, building design systems, improving visual aesthetics, mobile adaptation.
- Mobile-first responsive layouts, optimize for thumb-reach
- Design with Tailwind CSS classes + shadcn/ui components
- Use 4px/8px spacing grid, smooth corner radius (8-16px)
- All components must have states: default, hover, focus, active, disabled, loading, error, empty, dark mode
- Large tap targets (48x48px min), generous whitespace
- Accessibility built-in: WCAG compliance, keyboard navigation, ARIA labels
- Framer Motion for micro-interactions, respect `prefers-reduced-motion`
- Calming palette: avoid bright/aggressive colors (except SOS red #DC2626)

## Environment Variables

```
NEXT_PUBLIC_INSTANT_APP_ID, INSTANT_ADMIN_TOKEN
ANTHROPIC_API_KEY
TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
```
