# Testing Guide — testLens

This document covers the full test suite: what each layer tests, how to run it, the DB strategy, CI setup, and what's planned next.

---

## Overview

| Layer | Tool | Scope | Tests |
|---|---|---|---|
| API unit | Vitest + Prisma | Server actions: createApiKey, revokeApiKey, validateApiKey | 7 |
| DB integration | Vitest + Prisma | Schema defaults, ownership isolation, cascade deletes | 18 |
| E2E browser | Playwright | Full user flows through the UI in a real browser | 33 |
| BDD | Cucumber + Playwright | Same flows expressed as Gherkin feature files | 23 scenarios |
| Load | k6 | Ingest throughput, auth rejection, badge latency | 3 scenarios |

All tests live under `apps/web/tests/`. Run all commands from `apps/web/` unless noted.

---

## Environment Setup

Create `apps/web/.env.test` before running any Vitest or Cucumber suite:

```env
DATABASE_URL=postgresql://...pooler.neon.tech/testlens-test
DIRECT_URL=postgresql://...neon.tech/testlens-test
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
TEST_CLERK_ID=test_user_id_vitest
TEST_CLERK_ID_B=test_user_id_vitest_b
TESTLENS_API_KEY=tlk_test_static_key_for_vitest
```

Fill in the Neon test branch URLs and Clerk test-mode keys. The static values (`TEST_CLERK_ID`, `TEST_CLERK_ID_B`, `TESTLENS_API_KEY`) are checked in and safe to use as-is.

Push the schema to the test DB after any migration:

```bash
npm run db:push:test
```

---

## Running Each Suite

### Vitest — API Tests

Tests server actions for API key creation, revocation, and validation.

```bash
npm run test:api          # run once
npm run test:api:watch    # watch mode during development
npm run test:api:coverage # run with V8 coverage report
```

### Vitest — DB Integration Tests

Tests schema defaults, cross-user data isolation at the ORM layer, and cascade deletes across the full Project → Run → Suite → Test → Attachment chain.

```bash
npm run test:db
```

### Playwright — E2E Tests

Full browser tests covering upload, run summary, suite breakdown, tests view, failed tests, flaky tests, project management, and settings. Requires the app to NOT be running on port 3000 — Playwright's global setup starts its own Next.js server.

```bash
npm run test:e2e          # headless Chromium
npm run test:e2e:headed   # headed (watch the browser)
npm run test:e2e:ui       # Playwright UI mode (interactive)
```

### Cucumber — BDD Tests

The same flows as E2E but written in Gherkin. Drives a real Playwright browser. Runs sequentially (`parallel: 1`) because all scenarios share the Neon test branch and the same Clerk test user.

```bash
npm run test:cucumber           # full suite
npm run test:cucumber:smoke     # @smoke scenarios only
npm run test:cucumber:headed    # headed browser
```

### Run Everything (except load)

```bash
npm run test:all   # api + db + e2e in sequence
```

---

## Docker vs Neon

| | Docker | Neon test branch |
|---|---|---|
| Speed | Fast (local) | Network-bound |
| Isolation | Full — tmpfs wipes on stop | Shared test branch; clean up between runs |
| CI | Used in GitHub Actions | Not used in CI |
| Playwright / Cucumber | Not supported | Required |
| Setup | `npm run docker:up` | `.env.test` credentials |

### Using Docker

Docker spins up `postgres:16-alpine` on port 5433 with tmpfs storage (data is discarded on stop — no cleanup needed).

```bash
npm run docker:up     # start the container
npm run test:docker   # run api + db tests against Docker DB
npm run docker:down   # stop and remove
```

The `test:docker` script overrides `DATABASE_URL` to `postgresql://testlens:testlens@localhost:5433/testlens` via `cross-env`. No `.env.test` DB credentials needed when using Docker.

### When to use which

Use Docker when:
- You do not have Neon credentials yet
- You want a fully disposable, reproducible environment
- You are running in CI (GitHub Actions always uses Docker for Vitest)

Use Neon when:
- Running Playwright or Cucumber — they require a persistent DB with seeded data accessible from the browser test session
- You want to inspect DB state after a failed run

---

## k6 Load Testing

k6 tests target a **running app instance** — start the dev server first. Never point k6 at production.

### Prerequisites

Install k6 from [k6.io/docs/get-started/installation](https://k6.io/docs/get-started/installation). It is not an npm package and is not installed by `npm install`.

k6 scenario files live under `tests/load/scenarios/` and use a separate `tsconfig.json` scoped to `"types": ["k6"]`. This prevents `@types/k6`'s global `open()` from conflicting with Node types in the rest of the suite.

### Running scenarios

```bash
# Start the app first
npm run dev

# In a separate terminal, from apps/web/:
npm run test:load        # POST /api/runs ingest throughput
npm run test:load:auth   # API key rejection rate
npm run test:load:badge  # GET badge latency
npm run test:load:all    # all three in sequence
```

Pass `BASE_URL` and `PROJECT_SLUG` to target a non-default host or project:

```bash
BASE_URL=http://localhost:3001 PROJECT_SLUG=my-project npm run test:load
```

### Thresholds

| Scenario | Metric | Threshold |
|---|---|---|
| `ingest.ts` | p95 response time | < 800 ms |
| `ingest.ts` | Error rate | < 1% |
| `badge.ts` | p95 response time | < 200 ms |
| `badge.ts` | Error rate | < 1% |
| `api-key-auth.ts` | 401 rejection rate | > 99% |

### Load profiles

`ingest.ts` and `badge.ts` use a ramp-up profile: 0 → 10 VUs over 30 s, hold at 50 VUs for 1 min, ramp down over 30 s.

`api-key-auth.ts` uses a spike profile: 0 → 100 VUs in 10 s, hold for 30 s, ramp down over 10 s.

---

## Cucumber Tagging Strategy

| Tag | Meaning |
|---|---|
| `@smoke` | Critical path — upload flow, home page, project create. Run first to gate the rest. |
| `@regression` | Full suite default. Applied to every scenario. |
| `@settings` | API key management scenarios. |
| `@projects` | Project create and list scenarios. |
| `@flaky` | Flaky test view scenarios. |
| `@wip` | Work in progress — never committed while passing. |

Run a subset with `--tags`:

```bash
npm run test:cucumber:smoke           # @smoke only
cucumber-js --tags "@settings"        # settings scenarios only
cucumber-js --tags "not @wip"         # everything except wip
```

---

## Architecture Notes

### Real DB, not mocked (Vitest)

Vitest hits a real Postgres database — either the Neon test branch or the Docker container. There are no in-memory or SQLite mocks. Factories create records before each test; cleanup runs in `afterAll` / `afterEach` hooks.

`singleFork: true` is set permanently in `vitest.config.ts`. Parallel workers cause race conditions against a shared DB.

### Clerk always mocked (Vitest)

Vitest never makes real Clerk network calls. All tests mock `@clerk/nextjs/server` via static import:

```typescript
import { auth } from '@clerk/nextjs/server'
import { vi, type Mock } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))

beforeEach(() => {
  (auth as Mock).mockResolvedValue({ userId: TEST_CLERK_ID })
})
```

API key auth is tested directly — Supertest requests set the `Authorization: Bearer` header, bypassing Clerk entirely.

### Factories as schema canaries

All test records are created through `tests/helpers/factories.ts`, typed against Prisma's `UncheckedCreateInput`. If a migration introduces a breaking schema change, the factory files fail `tsc --noEmit` before any test runs — catching drift at compile time.

### Playwright auth

E2E tests authenticate via a seeded Clerk test token stored as browser `storageState`. The `tests/e2e/global-setup.ts` script authenticates once and writes browser storage state to disk; all spec files reuse it without re-authenticating.

### Cucumber concurrency

`parallel: 1` is non-negotiable. All Cucumber scenarios share the Neon test branch and the same Clerk test user session. Running in parallel causes flaky state collisions.

### k6 tsconfig isolation

The root `tsconfig.json` excludes `tests/load/` and sets `"types": ["node"]`. The `tests/load/tsconfig.json` scopes `"types": ["k6"]` for the load directory only. This is required — `@types/k6` declares a global `open()` that conflicts with Node's `fs.open`.

### Pre-session checklist

Before starting any test session after a schema migration:

```bash
npm run db:push:test    # push schema to Neon test branch
npx tsc --noEmit        # must return zero errors — fix before writing tests
# kill the dev server if it is running on port 3000
# npm run docker:down if a Docker container is already running on port 5433
```

---

## GitHub Actions CI

The CI workflow runs on every push to `main` and on every pull request. Defined at `.github/workflows/test.yml`.

### Jobs

**`vitest` — Vitest (API + DB)**

- Spins up `postgres:16-alpine` as a service on port 5433
- Pushes the Prisma schema via `prisma db push --skip-generate`
- Runs `npm run test:docker` (both `tests/api` and `tests/db`)
- Uses the Docker DB — no Neon credentials required in CI for this job

**`e2e` — Playwright E2E**

- Runs after `vitest` passes (`needs: vitest`)
- Installs Chromium via `playwright install --with-deps chromium`
- Runs `npm run test:e2e` against the Neon test branch (via GitHub Secrets)

### Secrets required in GitHub

| Secret | Used by |
|---|---|
| `DATABASE_URL` | E2E job — Neon test branch pooler URL |
| `DIRECT_URL` | E2E job — Neon test branch direct URL |
| `CLERK_SECRET_KEY` | Both jobs |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Both jobs |

Cucumber and k6 are not included in CI — they run locally only.

---

## What's Not Covered Yet

| Gap | Notes |
|---|---|
| `tests/api/runs.test.ts` | Supertest route handler tests for `POST /api/runs` and `GET /api/runs/[runId]` |
| `tests/api/upload.test.ts` | Supertest route handler tests for the manual upload endpoint |
| `tests/api/badge.test.ts` | Supertest route handler tests for `GET /api/projects/[slug]/badge` |
| Cucumber in CI | Requires a hosted browser + Neon access; not yet wired into the GitHub Actions workflow |
| k6 in CI | Load tests need a live app instance; candidates are a staging-environment gate or a scheduled nightly run |
| Adapter package tests | `packages/adapter-xunit` and `packages/adapter-nunit` have no unit tests for XML parsing edge cases |
| Attachment viewer | Screenshot/video attachment UI is planned for v2; no test coverage scoped for v1 |
