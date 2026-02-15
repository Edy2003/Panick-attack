# Task Assignments — PanicAttack Helper

Generated: 2026-02-15 (updated)
PRD Reference: `prd_panic_attack_helper_20260215.md`

## Task Assignment Table

| Task ID | Description | Type | Phase | Dependencies | Effort | Status |
|---------|-------------|------|-------|--------------|--------|--------|
| TASK-001 | Project Setup & Configuration (Next.js 15, Tailwind, shadcn/ui, Serwist, all deps) | DevOps/Setup | 1: Foundation | None | S (2-3h) | To Do |
| TASK-002 | Supabase Database Setup (schema, migrations, RLS, triggers, functions) | Database | 1: Foundation | TASK-001 | S (2-3h) | To Do |
| TASK-003 | Design System & Layout (color palette, typography, AppShell, navigation, SOS placeholder) | Frontend | 1: Foundation | TASK-001 | M (4-6h) | To Do |
| TASK-004 | i18n Setup — Ukrainian + English with next-intl, composable middleware | Frontend | 1: Foundation | TASK-001 | S (2-3h) | To Do |
| TASK-005 | Voice AI Chat — Backend (Claude API, system prompt, safety filter, rate limiting) | Backend | 2: Core | TASK-001 | M (4-6h) | To Do |
| TASK-006 | Voice AI Chat — Frontend (Web Speech API STT/TTS, chat UI, voice button) | Frontend | 2: Core | TASK-003, TASK-004, TASK-005 | L (8-12h) | To Do |
| TASK-007 | SOS Button — Backend (Telegram Bot + webhook, Twilio WhatsApp, device tokens) | Backend | 2: Core | TASK-001, TASK-002 | M (4-6h) | To Do |
| TASK-008 | SOS Button — Frontend (SOS UI, countdown, contact setup, Telegram deep link, offline queue) | Frontend | 2: Core | TASK-003, TASK-004, TASK-007 | L (8-12h) | To Do |
| TASK-009 | Optional Authentication (Supabase Auth, Email + Google OAuth, extend middleware) | Full Stack | 2: Core | TASK-002, TASK-003, TASK-004 | M (4-6h) | To Do |
| TASK-010 | Breathing Exercises (animated circle, 4 techniques with timings, timer, audio cues) | Frontend | 3: Additional | TASK-003, TASK-004 | M (4-6h) | To Do |
| TASK-011 | Grounding 5-4-3-2-1 (step wizard, voice/tap input, progress bar) | Frontend | 3: Additional | TASK-003, TASK-004 | M (4-6h) | To Do |
| TASK-012 | Anxiety Journal (quick log, charts, export, localStorage + Supabase sync) | Full Stack | 3: Additional | TASK-002, TASK-003, TASK-004 | L (8-12h) | To Do |
| TASK-013 | Articles & Tips Library (MDX content, search, bookmarks, uk/en) | Frontend/Content | 3: Additional | TASK-003, TASK-004 | M (4-6h) | To Do |
| TASK-014 | PWA Configuration (manifest, Serwist service worker, icons, install prompt) | DevOps/Frontend | 4: Polish | TASK-001 | S (2-3h) | To Do |
| TASK-015 | Offline Fallback (offline page, SOS queue, chat fallback, banner) | Frontend | 4: Polish | TASK-014, TASK-010, TASK-011 | M (4-6h) | To Do |
| TASK-016 | Integration Testing & Audit (E2E Playwright, Lighthouse, a11y, offline, security) | QA | 4: Polish | TASK-006, TASK-008, TASK-015 | L (8-12h) | To Do |

**Effort legend**: S = Small (2-3h), M = Medium (4-6h), L = Large (8-12h)

## Key Changes from v1

1. **TASK-004 (i18n) is now a dependency of all UI tasks** — prevents hardcoded strings that need refactoring later
2. **TASK-007 now depends on TASK-002** — needs `device_tokens` and `emergency_contacts` tables with `telegram_link_token`
3. **TASK-009 now depends on TASK-004** — middleware.ts is created in TASK-004 as composable; TASK-009 extends it
4. **TASK-016 added** — Integration testing & audit as final quality gate
5. **Effort estimates added** — S/M/L sizing for planning
6. **Total effort**: ~70-90 hours (solo developer)

## Execution Order (Recommended)

### Phase 1 — Foundation (all parallel after TASK-001)
```
TASK-001 (Setup)
    ├── TASK-002 (Database)     ← can start immediately
    ├── TASK-003 (Design System) ← can start immediately
    ├── TASK-004 (i18n)          ← can start immediately
    └── TASK-014 (PWA Config)    ← can start immediately
```

### Phase 2 — Core Features (converging streams)
```
Stream A (Backend):
    TASK-002 → TASK-007 (SOS Backend)
    TASK-001 → TASK-005 (Voice AI Backend)

Stream B (Frontend — needs TASK-003 + TASK-004 complete):
    TASK-003 + TASK-004 + TASK-005 → TASK-006 (Voice AI Frontend)
    TASK-003 + TASK-004 + TASK-007 → TASK-008 (SOS Frontend)
    TASK-002 + TASK-003 + TASK-004 → TASK-009 (Auth)
```

### Phase 3 — Additional Features (needs TASK-003 + TASK-004)
```
    TASK-003 + TASK-004 → TASK-010 (Breathing)
    TASK-003 + TASK-004 → TASK-011 (Grounding)
    TASK-002 + TASK-003 + TASK-004 → TASK-012 (Journal)
    TASK-003 + TASK-004 → TASK-013 (Articles)
```

### Phase 4 — Polish & QA
```
    TASK-014 + TASK-010 + TASK-011 → TASK-015 (Offline Fallback)
    TASK-006 + TASK-008 + TASK-015 → TASK-016 (Integration Testing)
```

## Critical Path

Longest dependency chain (determines minimum duration):
```
TASK-001 → TASK-003 ──→ TASK-010 → TASK-015 → TASK-016
TASK-001 → TASK-004 ─↗            ↗
TASK-001 → TASK-014 ─────────────
```

Estimated critical path duration: ~28-40h (TASK-001 + TASK-003 + TASK-004 + TASK-010 + TASK-015 + TASK-016)

## Bottleneck Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| TASK-003 (Design System) blocks 8 downstream tasks | High | Prioritize; can ship minimal AppShell first, iterate on components |
| TASK-004 (i18n) blocks all UI tasks | High | Start immediately alongside TASK-003; minimal messages.json first |
| TASK-002 (Database) blocks TASK-007, 009, 012 | Medium | Can start backend tasks with mock data before DB is fully ready |
| TASK-005 + TASK-007 (both backends) converge into TASK-006/008 | Medium | Backend tasks are small (M); parallelize with frontend foundation |

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 16 |
| Phase 1 (Foundation) | 4 tasks + PWA config |
| Phase 2 (Core Features) | 5 tasks |
| Phase 3 (Additional Features) | 4 tasks |
| Phase 4 (Polish & QA) | 2 tasks + integration testing |
| Parallelizable Streams | 5 |
| Estimated Total Effort | 70-90 hours |
