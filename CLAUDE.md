# CLAUDE.md

Guidance for Claude Code (and other AI coding assistants) working in this repository.

## What this project is

**Chokma Growth OS** is a full-stack marketing/lead-generation and CRM platform for
**โชคมา.net (CHOKMA)**, a Thai online lottery/betting brand. It is a single Next-gen
"Manus WebDev" scaffold (React + Express + tRPC + MySQL/Drizzle) combining:

- A public **landing page** (`/`) built for ad-traffic conversion — hero, offers,
  trust/social-proof blocks, SEO/AEO content, JSON-LD structured data — with a lead
  capture form that records UTM/referrer/device attribution.
- A **CEO/marketing dashboard** (`/dashboard`) showing new leads, conversion rate,
  total deposits, ROI/CPA per campaign, an "Actual vs Result" automation view,
  affiliate/referral overview, and operational alerts.
- A **CRM** (`/crm`) for segmenting leads/customers by VIP tier
  (`standard/vip/vvip/whale`), tracking deposit history, and follow-up notes.
- A stubbed **broadcast automation** layer (LINE/Telegram/SMS queues) intended to
  replace a manual broadcast process ("Broadpung") over time — data model and
  status tracking exist; actual outbound sending is not wired up yet.

There is no `README.md` or `AGENTS.md` in this repo. Several root-level `.md` files
are project working documents (not app code) worth skimming for intent, in
descending order of relevance:
- `implementation_blueprint.md` — the system design/rollout plan (Thai).
- `todo.md` — running task checklist; the last several unchecked items describe
  planned Next.js/edge-middleware/telemetry work that has **not** been built in
  this repo (this app is Vite/Express, not Next.js — see Gotchas).
- `team_user_guide.md`, `broadcast_migration_path.md`,
  `attachment_integration_summary.md`, `reference_landing_patterns.md`,
  `chokma_landing_image_system.md`, `chokma_generated_assets.md`,
  `browser_test_notes.md` — supporting notes on ops, broadcast migration, and the
  landing-page image pipeline.

## Tech stack

- **Runtime/scaffold**: "Manus WebDev" template (OAuth + notifications + storage
  proxy all call out to a Manus/Forge backend service — see `server/_core/`).
- **Frontend**: React 19 + TypeScript, Vite 7, Tailwind CSS v4 (via
  `@tailwindcss/vite`), shadcn/ui ("new-york" style, see `components.json`),
  Radix UI primitives, `wouter` for routing (patched, see Gotchas),
  `@tanstack/react-query` + tRPC React client for data fetching, `recharts` for
  charts, `framer-motion`, `react-hook-form` + `zod` resolvers.
- **Backend**: Express 4 + tRPC v11 (`@trpc/server`), `superjson` transformer,
  session auth via signed JWT cookie (`jose`), OAuth handshake against a Manus
  auth service.
- **Database**: MySQL via `drizzle-orm` (`drizzle-orm/mysql2`) + `drizzle-kit`.
  Schema lives in `drizzle/schema.ts`; two migrations already generated.
- **Testing**: Vitest 2 (node environment for both server and client tests).
- **Tooling**: pnpm (packageManager pinned in `package.json`), Prettier, plain
  `tsc --noEmit` for type checking (no ESLint configured in this repo).

## Directory structure

```
chokma-growth-os/
├── client/
│   ├── public/                # static assets; __manus__/debug-collector.js is dev-only tooling
│   └── src/
│       ├── _core/hooks/       # Manus-scaffold-provided hooks (useAuth)
│       ├── components/        # app components + components/ui (shadcn primitives)
│       ├── contexts/          # ThemeContext
│       ├── hooks/             # app-specific hooks (useMobile, useComposition, usePersistFn)
│       ├── lib/                # trpc client wiring, cn()/utils
│       ├── pages/              # route-level pages: Home, Dashboard, CRM, ComponentShowcase, NotFound
│       ├── App.tsx             # wouter route table
│       └── main.tsx
├── server/
│   ├── _core/                  # Manus-scaffold plumbing: do not casually rewrite
│   │   ├── env.ts              # process.env -> ENV object (single source of config)
│   │   ├── sdk.ts              # OAuth/session (JWT) logic, calls out to OAUTH_SERVER_URL
│   │   ├── oauth.ts            # /api/oauth/callback route
│   │   ├── trpc.ts             # router/publicProcedure/protectedProcedure/adminProcedure
│   │   ├── context.ts          # tRPC context: attaches `user` from session cookie
│   │   ├── notification.ts     # notifyOwner() -> Manus Forge notification service
│   │   ├── storageProxy.ts, imageGeneration.ts, voiceTranscription.ts, dataApi.ts, map.ts, llm.ts
│   │   ├── vite.ts             # dev middleware / static prod serving
│   │   └── index.ts            # Express app bootstrap + port selection + startServer()
│   ├── routers.ts               # appRouter: the actual CHOKMA domain API (see below)
│   ├── db.ts                    # all Drizzle queries/mutations (data-access layer)
│   ├── leadQuality.ts            # transparent, rule-based lead scoring (no ML/black box)
│   ├── storage.ts                # S3-via-Forge presigned upload/download helpers
│   ├── marketing.router.test.ts  # tRPC router tests (mocks ./db and ./_core/notification)
│   └── auth.logout.test.ts       # auth.logout procedure test
├── shared/
│   ├── const.ts                  # cookie name, timeouts, shared error message strings
│   ├── types.ts                  # re-exports drizzle schema types + _core/errors
│   └── _core/errors.ts
├── drizzle/
│   ├── schema.ts                  # source of truth for DB tables/types (see Data model)
│   ├── relations.ts
│   ├── 0000_*.sql, 0001_*.sql      # generated migrations
│   └── migrations/                 # (currently empty, has .gitkeep)
├── patches/wouter@3.7.1.patch       # pnpm patch applied to wouter
├── build-chokma-landing-assets.mjs   # asset-manifest generator script (see Gotchas)
├── drizzle.config.ts, vite.config.ts, vitest.config.ts, tsconfig.json
└── components.json                    # shadcn/ui config
```

## Setup / dev / build / test / lint commands

Package manager is **pnpm** (pinned via `packageManager` in `package.json`;
`drizzle-kit`/wouter patching assume pnpm — npm/yarn are not verified to work).

```bash
pnpm install              # install deps (applies patches/wouter@3.7.1.patch automatically)

pnpm dev                  # NODE_ENV=development, tsx watch server/_core/index.ts
                           # Express boots Vite in middleware mode; app is served from
                           # one port (server auto-picks a free port starting at $PORT or 3000)

pnpm build                # vite build (client) + esbuild bundle of server/_core/index.ts -> dist/
pnpm start                # NODE_ENV=production node dist/index.js

pnpm check                # tsc --noEmit (type-check only, excludes *.test.ts — see tsconfig.json)
pnpm format               # prettier --write .
pnpm test                 # vitest run (server/**/*.test.ts, client/**/*.test.tsx per vitest.config.ts)

pnpm db:push              # drizzle-kit generate && drizzle-kit migrate (requires DATABASE_URL)
```

There is no lint script and no ESLint config in the repo — `pnpm check` (tsc) is
the closest thing to a lint gate. There is no `.github/workflows` CI in this repo
to cross-check commands against; the above is taken directly from `package.json`.

## Environment variables

No `.env.example` is checked in. Required vars, inferred from `server/_core/env.ts`
and callers:

| Variable | Used for |
| --- | --- |
| `DATABASE_URL` | MySQL connection string for Drizzle (`server/db.ts`, `drizzle.config.ts`) |
| `VITE_APP_ID` | Manus OAuth client id (`ENV.appId`) |
| `JWT_SECRET` | Secret for signing/verifying the session cookie (`ENV.cookieSecret`) |
| `OAUTH_SERVER_URL` | Base URL of the Manus OAuth service (`sdk.ts`) |
| `OWNER_OPEN_ID` | openId that is auto-promoted to `role: "admin"` on upsert (`db.ts`) |
| `BUILT_IN_FORGE_API_URL` | Manus "Forge" API base (notifications + storage presign) |
| `BUILT_IN_FORGE_API_KEY` | Bearer token for the Forge API |
| `PORT` | Preferred server port (auto-increments if busy) |
| `NODE_ENV` | `development` uses Vite middleware; anything else serves `dist/public` statically |

`getDb()` in `server/db.ts` lazily connects and tolerates a missing
`DATABASE_URL` (logs a warning, returns `null`/empty results) so `pnpm check` and
most of the app can run without a live database; anything that calls a mutating
`db.*` function without a DB configured will throw `"Database not available"`.

## Architecture & conventions actually used here

- **`_core` naming convention**: anywhere you see a `_core/` directory
  (`server/_core/`, `client/src/_core/`, `shared/_core/`) that's Manus
  scaffold-provided plumbing (OAuth, session, notification/storage proxying to
  the Manus Forge backend, generic tRPC setup). App-specific CHOKMA logic lives
  *outside* `_core` (`server/routers.ts`, `server/db.ts`, `server/leadQuality.ts`,
  `client/src/pages/*`). Prefer extending the non-`_core` files for product
  features; treat `_core` as template infrastructure.
- **tRPC is the only API layer** — there are no REST routes beyond
  `/api/oauth/callback` and the storage proxy. All domain logic hangs off
  `appRouter` in `server/routers.ts`, namespaced as `system`, `auth`, `campaigns`,
  `leads`, `dashboard`, `crm`, `operations`. Procedures use
  `publicProcedure` / `protectedProcedure` (requires session user) /
  `adminProcedure` (requires `role === "admin"`) from `server/_core/trpc.ts`.
- **Data-access is centralized**: `server/db.ts` holds every Drizzle query as a
  standalone async function (`createLead`, `listRecentLeads`,
  `getDashboardSnapshot`, etc.). Routers call these functions rather than
  building Drizzle queries inline — keep new domain logic consistent with that
  split (router = validation/orchestration, `db.ts` = persistence).
- **Path aliases** (defined identically in `vite.config.ts`, `vitest.config.ts`,
  and `tsconfig.json` — keep them in sync if you add one): `@` →
  `client/src`, `@shared` → `shared`, `@assets` → `attached_assets` (this
  directory does not currently exist in the repo; it's referenced only by the
  alias config, not by any import).
- **Lead scoring is intentionally rule-based and transparent**
  (`server/leadQuality.ts`): a 0–100 heuristic score built from additive/
  subtractive rules (has phone/LINE/Telegram, has UTM data, suspicious-pattern
  regex for bot/test traffic, etc.) that derives `vipTier`, `trafficStatus`, and
  human-readable Thai `reasons[]`/`riskFlags[]`. This is explicitly documented
  in `implementation_blueprint.md` as "no cloaking / no black-box" — don't
  replace it with an opaque scoring model without preserving that transparency
  requirement.
- **Every lead submission fans out to several side effects** in
  `leads.submit` (see `server/routers.ts`): score the lead → insert lead row →
  insert two `leadEvents` rows (`form_submit`, `ai_action`) → upsert a
  `customerProfiles` row → call `notifyOwner()` (Manus Forge notification,
  fails soft/returns `false` rather than throwing) → insert an
  `automationRuns` audit row recording expected vs actual outcome. If you touch
  this flow, keep all of these steps (they underpin the "Actual vs Result"
  dashboard view).
- **Auth model**: session cookie (`app_session_id`, `shared/const.ts`) is a
  JWT signed with `JWT_SECRET`, containing `{ openId, appId, name }`.
  `createContext` (`server/_core/context.ts`) tries to authenticate on every
  request and sets `ctx.user = null` on failure — auth is deliberately
  optional at the context level; enforcement happens per-procedure via
  `protectedProcedure`/`adminProcedure`.
- **Styling**: Tailwind v4 + shadcn/ui "new-york" style
  (see `components.json`), components under `client/src/components/ui/` are
  generated/shadcn-managed — prefer `pnpm dlx shadcn add <component>` semantics
  over hand-editing generated primitives when possible, though the repo has no
  shadcn CLI config beyond `components.json` verified here.
- **Testing pattern**: server tests mock the data layer at the module
  boundary (`vi.mock("./db", ...)`, `vi.mock("./_core/notification", ...)`) and
  exercise `appRouter` procedures directly via `appRouter.createCaller`-style
  context objects — see `server/marketing.router.test.ts` and
  `server/auth.logout.test.ts` for the pattern to follow for new router tests.
  `client/src/pages/Home.test.tsx` tests the landing page's asset/image wiring.

## Data model (drizzle/schema.ts)

Tables: `users` (auth), `campaigns`, `leads`, `leadEvents` (audit trail per
lead: `page_view`/`form_submit`/`contact`/`register`/`deposit`/`status_change`/
`note_added`/`ai_action`/`broadcast_sent`/`broadcast_reply`), `customerProfiles`
(VIP/whale segmentation + deposit totals), `vipNotes` (CRM follow-up notes),
`depositEvents`, `automationRuns` (records planned vs actual automation
outcomes — backs the "Actual vs Result" dashboard), `broadcastQueues` (LINE/
Telegram/SMS outbound queue status, source system `broadpung`/`manual`/
`system`). All inferred `Insert*`/select types are re-exported through
`shared/types.ts` — import types from there rather than reaching into
`drizzle/schema.ts` directly from client/shared code.

Run `pnpm db:push` after editing `drizzle/schema.ts` to regenerate + apply
migrations (requires `DATABASE_URL`).

## Gotchas

- **This is not the Next.js app described in `todo.md`'s unchecked items.**
  Several trailing TODOs talk about "Next.js App Router", "edge middleware",
  and a Telegram low-credit alert API route — none of that exists in this
  codebase; the actual app is Vite + Express + tRPC. Don't assume those TODOs
  describe the current architecture.
- **`build-chokma-landing-assets.mjs` hardcodes absolute paths** from the
  original Manus sandbox (`/home/ubuntu/chokma-growth-os`,
  `/home/ubuntu/webdev-static-assets/...`) and references CloudFront asset
  URLs. It will not run as-is outside that original environment — treat it as
  a record of the prompt/asset manifest (see `chokma_generated_assets.md`),
  not a runnable pipeline in this repo/host.
- **`wouter` is patched** via `patches/wouter@3.7.1.patch`
  (pnpm `patchedDependencies`), and `tailwindcss>nanoid` is pinned via
  `pnpm.overrides`. If you switch package managers or bypass pnpm, both of
  these will silently stop applying.
- **`node_modules` is not installed in a fresh checkout of this environment** —
  run `pnpm install` before `pnpm check`/`pnpm test`/`pnpm dev`.
- **`@assets` alias points at a non-existent `attached_assets/` directory.**
  It's configured in all three build tools but nothing currently imports
  through it — don't be surprised it resolves to nothing.
- **No ESLint** — `pnpm check` (tsc) and `pnpm test` (vitest) are the only
  automated gates; there's also no CI workflow in `.github/` to double check
  against.
- **Domain sensitivity**: this app's business domain is Thai online lottery/
  betting lead generation (VIP/whale customer tiers, deposit tracking,
  broadcast messaging to prospects). `implementation_blueprint.md` explicitly
  calls for human review before any real campaign launch or outbound
  broadcast send — automation here is scored/queued/audited, not
  auto-published.
- **Manus-scaffold coupling**: OAuth, notifications, and file storage all
  depend on a Manus "Forge"/OAuth backend (`OAUTH_SERVER_URL`,
  `BUILT_IN_FORGE_API_URL`/`KEY`). Local dev without those services configured
  will have auth/notifications/storage silently no-op or fail — this is
  expected, not a bug, per the fallbacks coded in `notification.ts`/`sdk.ts`.
