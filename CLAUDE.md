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

### Tests (Vitest)
```bash
npm -w @reagis/back run test       # Backend (src/**/__tests__/*.test.ts)
npm -w @reagis/web run test        # Web (Vitest + Testing Library, jsdom)
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

No linter, no coverage tool. Tests live next to the code in `__tests__/` folders: 11 test files, 39 cases (9 back: sessionController, joinHandler; 30 web: authStorage, RequireAuth, sessionSlice, components). Not covered: vote/reaction/presenter socket handlers, socketMiddleware, auth routes.

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

**Auth**: Presenters use email/password → JWT (1d). Participants are anonymous — device-based SHA256 token per session → participant JWT (6h).

**WebSocket events** are defined in `packages/shared/wsEvents.ts` (source of truth). Room pattern: `session:${sessionId}`. Vote counts are denormalized on `Question.options[].votes` via atomic `$inc`, with separate Vote documents for history.

**Web path alias**: `@/` maps to `src/` (configured in both `vite.config.ts` and `tsconfig.json`).

**Route separation (web)**: `/session/:code` = participant view, `/sessions/:id` = presenter view.

## Environment

Backend: copy `apps/back/.env.example` → `.env` (MONGO_URI, JWT_SECRET, CLIENT_URL, etc.)
Web: copy `apps/web/.env.example` → `.env` (VITE_API_URL, VITE_WS_URL). `VITE_API_URL` is required — there is no Vite proxy to the backend.

Deployment: web on Vercel (`vercel.json`), API on Render (`render.yaml`).

Node version: 22.18.0 (see `.nvmrc`)

## Key source structure
```
apps/back/src/
  models/          # Mongoose schemas (User, Session, Question, Vote)
  controllers/     # Business logic per entity
  routes/          # Express REST routes
  sockets/         # Socket.io handlers (joinHandler, presenterHandler, voteHandler, reactionHandler, rooms)
  middleware/      # Auth JWT (presenter + participant)

apps/web/src/
  pages/LandingPage  # Landing page (public)
  pages/presenter/ # Login, Home, Session (list), CreateSession, SessionDetail, EditSession, Presentation
  pages/participant/ # Join (code + QR scan), ParticipantSession, VotePage (sub-component)
  components/      # AppLayout, Sidebar, RequireAuth, Button, Badge, KpiCard, VoteBar, Modal, ConfirmDialog,
                   # Pagination, Spinner, SessionResults, SlideResults, VerticalBarChart, FloatingReactions, …
  api/             # Fetch layer (authApi, authStorage, sessionApi, questionApi)
  store/           # Redux slices (session, question, votes, ui) + socketMiddleware (WS ↔ Redux)
  socket.ts        # socket.io-client instance (autoConnect: false)
  styles/          # CSS files, kebab-case (global, ui, layout, login, sidebar, …)
```

## Conventions
- **Code language**: English (variables, functions, components)
- **Docs/commits**: French or English accepted
- **Web imports**: always use `@/` alias (e.g. `import X from "@/components/X"`)
- **CSS files**: kebab-case in `apps/web/src/styles/` (e.g. `session-results.css`), even for component styles
- **State management**: `useState` for simple pages, Redux when state is shared (WebSocket live data)
- **API layer**: files in `apps/web/src/api/` — fetch-based with custom error class
- **Session codes**: generated client-side (format `RG-XXXX`), backend enforces uniqueness (409 on conflict)
- **Vote uniqueness**: enforced by MongoDB unique index, NOT application logic
- **Denormalized counters**: `Question.options[].votes` updated via `$inc`, never count on the fly

## Design system (Kinetic Noir)
Dark theme optimized for low-light environments (bars, conferences).
- **Source of truth for implemented tokens**: `apps/web/src/styles/global.css` (CSS variables)
- **Primary orange**: `#D85A30` (`--primary`), hover `#C04E27`
- **Surface**: `#0A0A0A` background (level 0), `#1A1A1A` cards (level 1), `#262626` overlays (level 2), `#404040` outlines
- **Typography**: Sora (headings), Inter (body) — the original spec in `docs/DESIGN.md` mentions Geist, the code uses Inter
- **Grid**: 8px base spacing, 4px border-radius for small elements
- **Depth**: tonal levels (not shadows) — level 0/1/2
- Full spec in `docs/DESIGN.md`, visual reference in `docs/ui-kit.html`

## Database design decisions
- Vote documents have partial unique indexes on `{question, participantToken}` and `{question, user}` — the DB itself prevents duplicate votes even under concurrent load
- Counters denormalized in Question.options with atomic `$inc` — no race conditions
- Session status is a state machine: `draft → active ↔ paused → finished`

## API contracts

Full reference: `docs/api-routes.md`.

**Response envelopes** — two formats coexist:
- Auth routes (`/api/auth/*`): `{ result: true/false, error?, token?, user? }`
- All other routes: bare document on success, `{ message: string }` on error

**Auth guards status** (known gaps):
- Protected (presenter JWT + ownership check): `GET /sessions/my-sessions`, `PATCH /sessions/:id`, `DELETE /sessions/:id`, `PATCH /sessions/:id/{start,next-question,previous-question,pause,resume,end}`
- Protected (participant JWT): `POST /votes/vote`
- Unprotected (should be): `POST /sessions` (presenter taken from body), `POST /questions`, `PATCH /questions/:id`, `DELETE /questions/:id`, `PATCH /questions/reorder/:sessionId`
- CORS falls back to `*` when `CLIENT_URL` is not set

**WebSocket events implemented** (all of `wsEvents.ts`): `join_session`, `presenter_join`, `submit_vote`, `send_reaction`, `vote_update`, `reaction_update`, `question_changed`, `session_started`, `session_paused`, `session_resumed`, `session_ended`, `participant_count`. Votes go through WebSocket (`submit_vote`); the REST `POST /votes/vote` is an unused fallback.

## Project status
The features of the 6-sprint plan are implemented (real-time, reactions, reconnection, QR code, pause/resume, presentation view). See `docs/roadmap-trello.csv` for the original plan and `docs/plano-entregaveis.md` for the remaining hardening/test backlog.
