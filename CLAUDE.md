testLens — CLAUDE.md (Test Suite)

Who You Are

You are Claude Code, executing test suite build sessions for testLens. You write TypeScript, follow the decisions in CONTEXT.md exactly, and never commit or push without explicit owner instruction. After every file change that includes TypeScript, run tsc --noEmit and fix all errors before moving on. You are building the test suite only — never modify application source files unless fixing a bug surfaced by a test.

Absolute Rules

Never commit or push — owner reviews all changes before any git operation
Never modify files outside tests/, vitest.config.ts, playwright.config.ts, docker-compose.yml, .github/workflows/, and root package.json scripts
Run tsc --noEmit after every TypeScript file change
Never make real network calls to Claude, Stripe, Clerk, or any external service in Vitest tests — mock everything
Never run k6 against production
No code comments — clean code only
If something is ambiguous, stop and ask — do not assume

Test Folder Structure (target state)

tests/
api/ ← Vitest + Supertest (route handler tests)
runs.test.ts ← POST /api/runs, GET /api/runs/[runId]
upload.test.ts ← POST /api/upload (Clerk session auth)
badge.test.ts ← GET /api/projects/[slug]/badge
api-keys.test.ts ← createApiKey, revokeApiKey server actions
db/ ← Vitest direct Prisma (no HTTP)
schema.test.ts ← model defaults, field storage
ownership.test.ts ← cross-user data isolation at ORM layer
cascade.test.ts ← cascade deletes (Project→Run→Suite→Test)
e2e/ ← Playwright specs
upload.spec.ts
run-summary.spec.ts
suites.spec.ts
tests-view.spec.ts
failed.spec.ts
flaky.spec.ts
projects.spec.ts
settings.spec.ts
cucumber/ ← Gherkin BDD (Cucumber + Playwright browser)
features/
upload.feature
run-summary.feature
projects.feature
settings.feature
failed-tests.feature
flaky-tests.feature
steps/
upload.steps.ts
run-summary.steps.ts
projects.steps.ts
settings.steps.ts
failed-tests.steps.ts
flaky-tests.steps.ts
support/
world.ts
hooks.ts
cucumber.config.ts
load/ ← k6 scenarios
config.ts
helpers/
auth.ts
scenarios/
ingest.ts
api-key-auth.ts
badge.ts
helpers/ ← shared across all suites
factories.ts
auth.ts
seed.ts

Package Versions (pin these exactly)

vitest: 2.x
@vitest/coverage-v8: 2.x
supertest: 7.x
@types/supertest: 6.x
@playwright/test: 1.x
@cucumber/cucumber: 11.x
@types/k6: 0.x
fast-xml-parser: 4.x (already installed)

Environment Variables

# apps/web/.env.test

DATABASE*URL=postgresql://...pooler.neon.tech/testlens-test
DIRECT_URL=postgresql://...neon.tech/testlens-test
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test*...
CLERK*SECRET_KEY=sk_test*...
TEST_CLERK_ID=test_user_id_vitest
TEST_CLERK_ID_B=test_user_id_vitest_b
TESTLENS_API_KEY=tlk_test_static_key_for_vitest

Owner fills these in manually — never generate or assume values.

Auth Mocking Pattern (Vitest)

All Vitest tests mock Clerk via static import — never via require():

typescriptimport { auth } from '@clerk/nextjs/server'
import { vi, type Mock } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
auth: vi.fn(),
}))

beforeEach(() => {
(auth as Mock).mockResolvedValue({ userId: TEST_CLERK_ID })
})

API key auth is tested by setting the Authorization: Bearer header directly on Supertest requests — no mocking needed for that path.

Factory Pattern

All test records created via tests/helpers/factories.ts. Factories are typed against Prisma UncheckedCreateInput — a schema drift canary. If a factory throws or fails tsc, a migration introduced a breaking change.

typescriptexport async function projectFactory(userId: string, overrides = {}) {
return prisma.project.create({
data: {
name: 'Test Project',
slug: `test-project-${Date.now()}`,
userId,
...overrides,
},
})
}

export async function runFactory(projectId: string, overrides = {}) {
return prisma.run.create({
data: {
runAt: new Date(),
framework: 'xunit',
duration: 5000,
totalTests: 4,
passed: 2,
failed: 1,
skipped: 0,
flaky: 1,
schemaVersion: '1.0.0',
projectId,
...overrides,
},
})
}

export async function suiteFactory(runId: string, overrides = {}) {
return prisma.suite.create({
data: {
name: 'AuthTests',
duration: 1200,
runId,
...overrides,
},
})
}

export async function testFactory(suiteId: string, overrides = {}) {
return prisma.test.create({
data: {
title: 'Login_WithValidCredentials_Passes',
status: 'passed',
duration: 400,
retries: 0,
tags: [],
suiteId,
...overrides,
},
})
}

export async function apiKeyFactory(userId: string, overrides = {}) {
return prisma.apiKey.create({
data: {
name: 'Test Key',
keyHash: 'test-hash-' + Date.now(),
userId,
...overrides,
},
})
}

Key Architecture Notes

Real DB, not mocked (Vitest). Vitest hits the real Neon test branch (separate from production). Create a test branch in the testLens Neon project and put its connection strings in .env.test.

Docker as alternative DB target. docker-compose.yml spins up postgres:16-alpine on port 5433 with tmpfs storage. Used by test:docker scripts and GitHub Actions CI.

Clerk always mocked (Vitest). Static import pattern above — never real Clerk calls.

API key auth tested directly. POST /api/runs uses Bearer token auth — tests set the header directly on Supertest requests. A test API key is seeded in tests/helpers/seed.ts before the suite runs.

singleFork: true in vitest.config.ts — required permanently. Parallel workers cause race conditions against the real DB.

Cucumber uses standalone playwright package (not @playwright/test) to drive a real browser. parallel: 1 is non-negotiable — all scenarios share the Neon test branch and the same Clerk test user.

k6 does not mock. Load scenarios target a running app instance. App must be running locally before executing any test:load script. Never run against production.

tsconfig architecture for k6. Root tsconfig.json excludes tests/load/ and sets "types": ["node"]. A separate tests/load/tsconfig.json scopes "types": ["k6"] for the load directory only. This prevents @types/k6's global open() from conflicting with other types.

npm Scripts (add to apps/web/package.json)

json{
"test:api": "vitest run tests/api",
"test:db": "vitest run tests/db",
"test:api:watch": "vitest tests/api",
"test:api:coverage": "vitest run tests/api --coverage",
"test:docker": "cross-env DATABASE_URL=postgresql://testlens:testlens@localhost:5433/testlens vitest run tests/api tests/db",
"test:e2e": "playwright test",
"test:e2e:headed": "playwright test --headed",
"test:e2e:ui": "playwright test --ui",
"test:cucumber": "cucumber-js",
"test:cucumber:smoke": "cucumber-js --tags @smoke",
"test:cucumber:headed": "HEADLESS=false cucumber-js",
"test:load": "k6 run tests/load/scenarios/ingest.ts",
"test:load:auth": "k6 run tests/load/scenarios/api-key-auth.ts",
"test:load:badge": "k6 run tests/load/scenarios/badge.ts",
"test:load:all": "npm run test:load && npm run test:load:auth && npm run test:load:badge",
"test:all": "npm run test:api && npm run test:db && npm run test:e2e",
"docker:up": "docker-compose up -d postgres-test",
"docker:down": "docker-compose down"
}

Tagging Strategy (Cucumber)

TagMeaning@smokeCritical path — upload flow, run summary render@regressionFull suite default — applied to every scenario@settingsAPI key management scenarios@projectsProject create/list scenarios@flakyFlaky test view scenarios@wipWork in progress — never committed passing

k6 Thresholds

Route typep95 response timeError ratePOST /api/runs (ingest)< 800ms< 1%GET /api/projects/[slug]/badge< 200ms< 1%API key auth (invalid tokens)N/A401 rate > 99%

Pre-Session Checklist

bashnpm run db:push:test # after any migration
npx tsc --noEmit # must return zero errors

# kill dev server if running

# docker: npm run docker:down if a container is already running

SESSION 1 — Vitest Config + Factories + API Key Tests (DONE)

SESSION 2 — API Route Tests (runs + upload + badge) (DONE)

SESSION 3 — DB Integration Tests (DONE)

SESSION 4 — Playwright E2E Suite (DONE)

SESSION 5 — Cucumber/Gherkin BDD Suite (DONE)

SESSION 6 — k6 Load Tests + GitHub Actions CI (DONE)

SESSION 7 — TESTING.md (CURRENT TASK!)

Goal

Write a comprehensive TESTING.md at the repo root documenting the full test suite for any developer (or hiring manager) who reads the repo.

Steps

Create TESTING.md at monorepo root covering:

Overview table: layer / tool / scope / test count
Running each suite (all commands from npm scripts)
Docker setup and when to use Docker vs Neon
k6 prerequisites and how to run each scenario
Cucumber tagging strategy
Architecture notes (real DB, mocking strategy, singleFork, k6 tsconfig isolation)
Pre-session checklist
GitHub Actions CI overview
What's not covered yet (future)

Update README.md to link to TESTING.md
Final tsc --noEmit across entire monorepo — zero errors

Done When

TESTING.md is comprehensive, accurate, and matches the actual suite
README links to it
Zero TypeScript errors across monorepo
