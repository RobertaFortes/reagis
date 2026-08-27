# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Reagis — real-time collaborative polling/reaction platform. Monorepo with presenter web app (desktop), participant web app (mobile-first, responsive), Express backend, and shared constants package. **No mobile app** — everything runs on the web to avoid download friction for participants.

## Commands

### Setup
```bash
npm install   # Root install (covers back, web, shared)
```

### Development
```bash
npm -w @reagis/back run dev        # Backend: tsx watch on port 4000
npm -w @reagis/web run dev         # Web: Vite on port 5173
```

### Type checking
```bash
npm -w @reagis/back run typecheck  # Backend
npm -w @reagis/web run typecheck   # Web
```

### Build
```bash
npm -w @reagis/back run build      # tsc → dist/
npm -w @reagis/web run build       # typecheck + vite build
```

### Seed data
```bash
npm -w @reagis/back run seed:demo  # Populate DB with demo data
npm -w @reagis/back run ws:demo    # WebSocket test client
```

No linter or test framework configured.

### Run the full stack locally
```bash
# Terminal 1: backend
npm -w @reagis/back run dev
# Terminal 2: web
npm -w @reagis/web run dev
```

## Architecture

**Monorepo layout** — npm workspaces for `apps/back`, `apps/web`, `packages/shared`.

**Stack**: Express + Mongoose + Socket.io (back), React + Redux Toolkit + Vite (web). TypeScript throughout, `strict: false`.

**Key data flow**: Presenters create sessions with questions via REST API. Participants join via session code. Votes submitted through Socket.io, stored in MongoDB, and broadcast to the session room in real-time.

**Auth**: Presenters use email/password → JWT (7d). Participants are anonymous — device-based SHA256 token per session → participant JWT (6h).

**WebSocket events** are defined in `packages/shared/wsEvents.ts` (source of truth). Room pattern: `session:${sessionId}`. Vote counts are denormalized on `Question.options[].votes` via atomic `$inc`, with separate Vote documents for history.

**Web path alias**: `@/` maps to `src/` (configured in both `vite.config.ts` and `tsconfig.json`).

**Route separation (web)**: `/session/:code` = participant view, `/sessions/:id` = presenter view.

## Environment

Backend: copy `apps/back/.env.example` → `.env` (MONGO_URI, JWT_SECRET, CLIENT_URL, etc.)
Web: uses Vite env vars (VITE_API_URL, VITE_WS_URL)

Node version: 22.18.0 (see `.nvmrc`)

## Key source structure
```
apps/back/src/
  models/          # Mongoose schemas (User, Session, Question, Vote)
  controllers/     # Business logic per entity
  routes/          # Express REST routes
  sockets/         # Socket.io event handlers (joinSession, submitVote, sendReaction)
  middleware/      # Auth JWT (presenter + participant)

apps/web/src/
  pages/presenter/ # Login, Home, Sessions, CreateSession, SessionDetail
  pages/participant/ # Join, ParticipantSession (in progress)
  components/      # Button, Sidebar, Badge, KpiCard, VoteBar, AppLayout
  api/             # Fetch layer (authApi, sessionApi, questionApi)
  store/           # Redux slices (scaffolded, empty — to wire with WebSocket)
  styles/          # CSS files (global, ui, layout, login, Sidebar)
```

## Conventions
- **Code language**: English (variables, functions, components)
- **Docs/commits**: French or English accepted
- **Web imports**: always use `@/` alias (e.g. `import X from "@/components/X"`)
- **State management**: `useState` for simple pages, Redux when state is shared (WebSocket live data)
- **API layer**: files in `apps/web/src/api/` — fetch-based with custom error class
- **Session codes**: generated client-side (format `RG-XXXX`), backend enforces uniqueness (409 on conflict)
- **Vote uniqueness**: enforced by MongoDB unique index, NOT application logic
- **Denormalized counters**: `Question.options[].votes` updated via `$inc`, never count on the fly

## Design system (Kinetic Noir)
Dark theme optimized for low-light environments (bars, conferences).
- **Primary orange**: `#ffb59e` (tokens) / `#D85A30` (interactive states)
- **Surface**: `#131313` background, `#1A1A1A` cards, `#2a2a2a` elevated
- **Typography**: Sora (headings, geometric), Geist (body, semi-monospace for stable counters)
- **Grid**: 8px base spacing, `0.25rem` border-radius
- **Depth**: tonal levels (not shadows) — level 0/1/2
- Full spec in `docs/DESIGN.md`

## Database design decisions
- Vote documents have partial unique indexes on `{question, participantToken}` and `{question, user}` — the DB itself prevents duplicate votes even under concurrent load
- Counters denormalized in Question.options with atomic `$inc` — no race conditions
- Session status is a state machine: `draft → active → finished`

## API contracts

Full reference: `docs/api-routes.md`.

**Response envelopes** — two formats coexist:
- Auth routes (`/api/auth/*`): `{ result: true/false, error?, token?, user? }`
- All other routes: bare document on success, `{ message: string }` on error

**Auth guards status** (known gaps to fix in S4):
- Protected: `GET /my-sessions`, `PATCH /start`, `PATCH /end`, `POST /votes/vote`
- Unprotected (should be): `POST /sessions`, `POST /questions`, `DELETE /questions/:id`, `PATCH /reorder`

**WebSocket events implemented** (S3): `join_session`, `presenter_join`, `submit_vote`, `vote_update`, `participant_count`
**WebSocket events planned** (S4): `send_reaction`, `reaction_update`, `question_changed`, `session_ended`

## Current sprint (S3 — 24-28/08/2026)
Real-time P1: Socket.io rooms, WebSocket ↔ Redux middleware, live dashboard graphs.
See `docs/roadmap-trello.csv` for full 6-sprint plan (delivery: 14-19/09/2026).
