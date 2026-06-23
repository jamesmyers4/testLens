# testLens

**The summary point of all tests — past, present, and future.**

testLens is an open-source test run dashboard built for Selenium shops. It ingests normalized test result data from xUnit and NUnit XML output and renders it as a beautiful, historically-tracked, shareable web UI — filling the reporting gap that Playwright's built-in HTML reporter covers for Playwright users but no equivalent exists for .NET/C# teams.

If your team runs Selenium UI tests through xUnit or NUnit and your current "report" is a wall of terminal output or the Visual Studio Test Explorer that only you can see — testLens is for you.

> **Screenshot** — *(upload a real run and add a screenshot here)*

---

## Why testLens?

| | Visual Studio Test Explorer | testLens |
|---|---|---|
| Pass/fail visibility | ✅ | ✅ |
| Error messages | ✅ | ✅ |
| Shareable with team | ❌ | ✅ |
| Historical run tracking | ❌ | ✅ |
| Flaky test detection | ❌ | ✅ |
| CI pipeline integration | ❌ | ✅ |
| README status badge | ❌ | ✅ |
| Works outside your machine | ❌ | ✅ |

---

## Features

### Dashboard
- **Run Summary** — scorecard showing total, passed, failed, flaky, and skipped counts at a glance
- **Suite Breakdown** — expandable suite list sorted by failure count, with per-suite pass/fail/flaky/skip pills
- **All Tests** — full filterable test list with status, duration, retry count, and tags
- **Failed Tests** — failed tests only, error messages surfaced inline without clicking, stack traces on expand
- **Flaky Tests** — tests that eventually passed after retries, sorted by retry count — the ones silently costing you CI time
- **Project History** — paginated run history per project with branch, commit, environment, and duration

### Ingest
- **API-first CI ingest** — `POST /api/runs` with a Bearer token, designed to drop into any CI pipeline
- **Manual upload** — drag-and-drop JSON upload for local runs
- **xUnit adapter** — CLI tool that converts xUnit XML output to normalized testLens JSON
- **NUnit adapter** — CLI tool that converts NUnit XML output to normalized testLens JSON

### Developer Experience
- **README badge** — embed a live pass/fail/flaky shield in any README
- **GitHub Actions example** — reference workflow showing the full run → convert → post pipeline
- **Dark mode default** — with light mode toggle
- **Framework-agnostic schema** — normalized `TestRunReport` JSON contract that adapters produce and the dashboard consumes

---

## Tech Stack

![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![Neon](https://img.shields.io/badge/Neon-00E599?style=flat&logo=neon&logoColor=black)
![Clerk](https://img.shields.io/badge/Clerk-6C47FF?style=flat&logo=clerk&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-black?style=flat&logo=vercel)

- **Framework** — Next.js 15 App Router
- **Language** — TypeScript (strict mode)
- **Styling** — Tailwind CSS + shadcn/ui
- **Auth** — Clerk (single-user, API key for CI)
- **Database** — Prisma + Neon (Postgres)
- **Hosting** — Vercel
- **Adapters** — TypeScript/Node CLI packages (`@testlens/adapter-xunit`, `@testlens/adapter-nunit`)

---

## Monorepo Structure

```
testlens/
  apps/
    web/                        ← Next.js 15 dashboard
  packages/
    schema/                     ← Shared TypeScript types (TestRunReport schema)
    adapter-xunit/              ← CLI: xUnit XML → testLens JSON
    adapter-nunit/              ← CLI: NUnit XML → testLens JSON
  examples/
    github-actions.yml          ← Reference CI pipeline
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- A [Neon](https://neon.tech) Postgres database
- A [Clerk](https://clerk.com) application

### 1. Clone and install

```bash
git clone https://github.com/jamesmyers4/testLens.git
cd testLens
npm install
```

### 2. Configure environment

Create `apps/web/.env.local`:

```env
DATABASE_URL=postgresql://...pooler.neon.tech/testlens
DIRECT_URL=postgresql://...neon.tech/testlens
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### 3. Push database schema

```bash
cd apps/web
npx prisma db push
```

### 4. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`, sign up, create a project, and grab an API key from `/settings`.

---

## CI Integration

### Step 1 — Install the adapter

```bash
# For xUnit projects
npm install -g @testlens/adapter-xunit

# For NUnit projects
npm install -g @testlens/adapter-nunit
```

### Step 2 — Convert your XML output

```bash
testlens-convert \
  --input TestResults.xml \
  --framework xunit \
  --project my-project \
  --environment ci \
  --branch main \
  --commit abc123 \
  --out testlens-run.json
```

### Step 3 — Post to testLens

```bash
curl -X POST https://your-testlens.vercel.app/api/runs \
  -H "Authorization: Bearer $TESTLENS_API_KEY" \
  -H "Content-Type: application/json" \
  -d @testlens-run.json
```

### GitHub Actions Example

See [`examples/github-actions.yml`](examples/github-actions.yml) for a complete reference workflow covering: checkout → build → test → convert → post to testLens → comment on PR with run URL on failure.

---

## Normalized Schema

All adapters produce a `TestRunReport` — the contract the dashboard consumes. Framework-agnostic by design.

```typescript
interface TestRunReport {
  schemaVersion: string
  runId: string
  runAt: string
  framework: 'xunit' | 'nunit' | 'playwright' | 'jest' | 'vitest' | 'other'
  environment?: 'local' | 'ci' | 'staging' | 'production'
  branch?: string
  commitHash?: string
  duration: number
  projectSlug: string
  suites: Suite[]
}

interface Suite {
  name: string
  file?: string
  duration: number
  parentSuite?: string
  tests: Test[]
}

interface Test {
  id: string
  title: string
  status: 'passed' | 'failed' | 'skipped' | 'flaky'
  duration: number
  retries: number
  error?: { message: string; stack?: string }
  tags: string[]
  attachments: Attachment[]
}
```

Full type definitions live in [`packages/schema/src/index.ts`](packages/schema/src/index.ts).

---

## API Reference

### `POST /api/runs`
Ingest a test run. Authenticated via Bearer token.

**Headers**
```
Authorization: Bearer <api-key>
Content-Type: application/json
```

**Body** — a valid `TestRunReport` JSON object

**Response**
```json
{ "runId": "...", "url": "/projects/my-project/runs/..." }
```

### `GET /api/runs/[runId]`
Fetch a single run with all suites and tests. Authenticated via Clerk session.

### `GET /api/projects/[slug]/badge`
Returns an SVG status shield for embedding in READMEs. Public — no auth required.

```markdown
![testLens](https://your-testlens.vercel.app/api/projects/my-project/badge)
```

---

## Route Reference

| Route | Purpose |
|---|---|
| `/` | Home — all projects |
| `/projects/new` | Create a project |
| `/projects/[slug]` | Project dashboard — run history |
| `/projects/[slug]/upload` | Manual JSON upload |
| `/projects/[slug]/runs/[runId]` | Run summary scorecard |
| `/projects/[slug]/runs/[runId]/suites` | Suite breakdown |
| `/projects/[slug]/runs/[runId]/tests` | All tests, filterable |
| `/projects/[slug]/runs/[runId]/failed` | Failed tests only |
| `/projects/[slug]/runs/[runId]/flaky` | Flaky tests only |
| `/settings` | API key management |

---

## Roadmap

These features are explicitly planned for future versions:

- **Screenshot viewer** — attachment schema is already in place, UI coming in v2
- **Historical trend charts** — flaky rate over time, duration trends, pass rate over time
- **Playwright adapter** — `@testlens/adapter-playwright` custom reporter plugin
- **Slack / Teams webhooks** — notify on run failure
- **Multi-user workspaces** — team projects with roles
- **Tag-based analytics** — aggregate results by tag across runs

---

## Testing

The full test suite documentation — how to run each layer, Docker vs Neon, k6 prerequisites, Cucumber tags, CI setup, and architecture notes — lives in **[TESTING.md](TESTING.md)**.

Quick summary: 7 Vitest API tests, 18 Vitest DB integration tests, 33 Playwright E2E tests, 23 Cucumber BDD scenarios, and 3 k6 load scenarios.

---

## Status

testLens v1 is feature-complete. All ten build sessions are done.

| Session | Focus | Status |
|---|---|---|
| 1 | Monorepo scaffold, schema package | ✅ Complete |
| 2 | Prisma + Neon + Clerk auth | ✅ Complete |
| 3 | API key system, POST /api/runs | ✅ Complete |
| 4 | shadcn/ui, theme toggle, settings page | ✅ Complete |
| 5 | Projects home, new project, dashboard | ✅ Complete |
| 6 | Upload page, run summary scorecard | ✅ Complete |
| 7 | Suite breakdown, test views, failed, flaky | ✅ Complete |
| 8 | xUnit + NUnit CLI adapters | ✅ Complete |
| 9 | Badge endpoint, GitHub Actions example | ✅ Complete |
| 10 | Empty states, loading skeletons, error boundaries, README polish | ✅ Complete |

---

## Author

Built by [Jimmy Myers](https://github.com/jamesmyers4) — QA Engineer / SDET with 22 years of software industry experience, specializing in test automation with Playwright, Selenium, and C#/.NET.

---

## License

MIT
