# testLens — CONTEXT.md

## Project Overview

testLens is a multi-framework test run dashboard that ingests normalized test result JSON and renders it as a beautiful, shareable, historically-tracked web UI. It is designed for teams using Selenium with xUnit or NUnit in C#/.NET — filling a real gap that Playwright's built-in HTML reporter already covers for Playwright users but no equivalent exists for Selenium shops.

The tagline: **"The summary point of all tests — past, present, and future."**

Primary audience: .NET/C# teams running Selenium UI tests and unit tests through xUnit or NUnit, particularly in CI/CD pipelines (GitHub Actions). TherapyNotes is the archetype user.

---

## Monorepo Structure

```
testlens/
  apps/
    web/                        ← Next.js 15 App Router dashboard
  packages/
    schema/                     ← Shared TypeScript types (TestRunReport schema)
    adapter-xunit/              ← CLI converter: xUnit XML → normalized JSON
    adapter-nunit/              ← CLI converter: NUnit XML → normalized JSON
  examples/
    github-actions.yml          ← Example CI pipeline using testLens
  CONTEXT.md
  CLAUDE.md
```

---

## Tech Stack

| Layer     | Choice                       | Notes                              |
| --------- | ---------------------------- | ---------------------------------- |
| Framework | Next.js 15 App Router        | Same as Shenny                     |
| Language  | TypeScript                   | Strict mode                        |
| Styling   | Tailwind CSS + shadcn/ui     | Same as Shenny                     |
| Auth      | Clerk                        | Single-user, same as Shenny        |
| Database  | Prisma + Neon (Postgres)     | Scaffolded in v1, history UI in v2 |
| Hosting   | Vercel                       | Same as Shenny                     |
| Adapters  | TypeScript/Node CLI packages | npm-publishable from day one       |

---

## Normalized Schema (`packages/schema`)

Every adapter produces this shape. The dashboard only ever consumes this format — it is framework-agnostic by design.

```typescript
export interface TestRunReport {
  schemaVersion: string;
  runId: string;
  runAt: string;
  framework: "xunit" | "nunit" | "playwright" | "jest" | "vitest" | "other";
  environment?: "local" | "ci" | "staging" | "production";
  branch?: string;
  commitHash?: string;
  duration: number;
  projectSlug: string;
  suites: Suite[];
}

export interface Suite {
  name: string;
  file?: string;
  duration: number;
  parentSuite?: string;
  tests: Test[];
}

export interface Test {
  id: string;
  title: string;
  status: "passed" | "failed" | "skipped" | "flaky";
  duration: number;
  retries: number;
  error?: {
    message: string;
    stack?: string;
  };
  tags: string[];
  attachments: Attachment[];
}

export interface Attachment {
  name: string;
  type: "screenshot" | "video" | "trace" | "other";
  path?: string;
  base64?: string;
}
```

### Schema Design Decisions

- Suites are **flat** with an optional `parentSuite` string reference — no nesting
- `flaky` is a **first-class status** (failed on first attempt, passed on retry)
- `attachments` array is in schema v1; screenshot viewer UI is v2
- Schema is versioned via `schemaVersion` field for future migrations
- Playwright's output is the north star for schema decisions over time

---

## Prisma Data Model

```prisma
model User {
  id        String    @id @default(cuid())
  clerkId   String    @unique
  email     String    @unique
  createdAt DateTime  @default(now())
  projects  Project[]
  apiKeys   ApiKey[]
}

model Project {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  runs      Run[]
}

model Run {
  id            String   @id @default(cuid())
  externalId    String?
  runAt         DateTime
  framework     String
  environment   String?
  branch        String?
  commitHash    String?
  duration      Int
  totalTests    Int
  passed        Int
  failed        Int
  skipped       Int
  flaky         Int
  schemaVersion String
  projectId     String
  project       Project  @relation(fields: [projectId], references: [id])
  suites        Suite[]
  createdAt     DateTime @default(now())
}

model Suite {
  id          String  @id @default(cuid())
  name        String
  file        String?
  duration    Int
  parentSuite String?
  runId       String
  run         Run     @relation(fields: [runId], references: [id])
  tests       Test[]
}

model Test {
  id         String       @id @default(cuid())
  title      String
  status     String
  duration   Int
  retries    Int          @default(0)
  errorMsg   String?
  errorStack String?
  tags       String[]
  suiteId    String
  suite      Suite        @relation(fields: [suiteId], references: [id])
  attachments Attachment[]
}

model Attachment {
  id     String  @id @default(cuid())
  name   String
  type   String
  path   String?
  base64 String?
  testId String
  test   Test    @relation(fields: [testId], references: [id])
}

model ApiKey {
  id         String    @id @default(cuid())
  name       String
  keyHash    String    @unique
  lastUsedAt DateTime?
  createdAt  DateTime  @default(now())
  userId     String
  user       User      @relation(fields: [userId], references: [id])
}
```

---

## Route Structure

### App Routes

| Route                                  | Purpose                                 |
| -------------------------------------- | --------------------------------------- |
| `/`                                    | Home — lists all projects               |
| `/projects/new`                        | Create a project                        |
| `/projects/[slug]`                     | Project dashboard — lists runs          |
| `/projects/[slug]/upload`              | Manual JSON file upload (drag and drop) |
| `/projects/[slug]/runs/[runId]`        | Run summary scorecard                   |
| `/projects/[slug]/runs/[runId]/suites` | Suite breakdown (expandable)            |
| `/projects/[slug]/runs/[runId]/tests`  | All tests, filterable                   |
| `/projects/[slug]/runs/[runId]/failed` | Failed tests only                       |
| `/projects/[slug]/runs/[runId]/flaky`  | Flaky tests only                        |
| `/settings`                            | API key management                      |

### API Routes

| Route                        | Method | Purpose                                           |
| ---------------------------- | ------ | ------------------------------------------------- |
| `/api/runs`                  | POST   | CI ingest — accepts normalized TestRunReport JSON |
| `/api/runs/[runId]`          | GET    | Fetch single run                                  |
| `/api/projects/[slug]/badge` | GET    | Returns SVG status badge for README               |

---

## Ingest Flow

### API-first (preferred — CI pipeline)

```
Run tests in VS / CI
→ XML output written by xUnit or NUnit
→ testlens-convert --input results.xml --framework xunit --project my-project --out testlens-run.json
→ POST /api/runs with Authorization: Bearer <apiKey>
→ Run persisted to DB
→ Dashboard updated
```

### Manual upload (fallback)

```
Run tests locally
→ Convert XML to JSON with testlens-convert CLI
→ Visit /projects/[slug]/upload
→ Drag and drop testlens-run.json
→ Redirects to /projects/[slug]/runs/[runId] on success
```

---

## Adapter Packages

### `@testlens/adapter-xunit`

CLI converter for xUnit XML output.

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

### `@testlens/adapter-nunit`

CLI converter for NUnit XML output. Identical CLI surface, different XML parser (NUnit and xUnit XML schemas differ meaningfully).

```bash
testlens-convert \
  --input TestResults.xml \
  --framework nunit \
  --project my-project \
  --environment ci \
  --branch main \
  --commit abc123 \
  --out testlens-run.json
```

Both packages are npm-publishable from day one under `@testlens/` scope even if not published to registry in v1.

---

## Authentication

- Clerk for user auth (single-user in v1)
- API keys for CI pipeline authentication (`Authorization: Bearer <key>`)
- Keys are hashed before storage (never stored in plaintext)
- Key management UI lives at `/settings`
- Multi-user / workspace model is v2

---

## Visual Design

| Token             | Value                        |
| ----------------- | ---------------------------- |
| Component library | shadcn/ui                    |
| Styling           | Tailwind CSS                 |
| Default mode      | Dark, with light mode toggle |
| Passed            | `emerald-500`                |
| Failed            | `red-500`                    |
| Flaky             | `amber-400`                  |
| Skipped           | `slate-400`                  |
| Duration callouts | `blue-400`                   |

---

## v1 Dashboard Views

### Run Summary (`/runs/[runId]`)

Top-level scorecard: total, passed, failed, skipped, flaky counts, duration, framework, environment, branch, commit hash. Quick-nav to suites / tests / failed / flaky views.

### Suite Breakdown (`/runs/[runId]/suites`)

Expandable list of suites. Each suite shows name, file path, duration, pass/fail/skip/flaky counts. Expand to see individual tests inline.

### All Tests (`/runs/[runId]/tests`)

Full test list with status badges, duration, retry count. Filterable by status and tag.

### Failed Tests (`/runs/[runId]/failed`)

Failed tests only. Error message surfaced immediately without clicking in. Stack trace available on expand.

### Flaky Tests (`/runs/[runId]/flaky`)

Flaky tests only, sorted by retry count descending. Surfaces tests that eventually passed but required retries.

---

## README Badge

`GET /api/projects/[slug]/badge` returns an SVG shield showing pass/fail/flaky counts from the most recent run. Embeddable in any README:

```markdown
![testLens](https://your-testlens.vercel.app/api/projects/my-project/badge)
```

---

## GitHub Actions Example (`examples/github-actions.yml`)

Ships in v1 as a reference workflow showing: run tests → convert XML → POST to testLens.

---

## v2 Roadmap (explicitly out of scope for v1)

- Screenshot / attachment viewer UI
- Historical trend charts (flaky rate over time, duration trends)
- Multi-user / workspace / team support
- Playwright adapter (`@testlens/adapter-playwright`)
- Slack / Teams webhook notifications on run failure
- Tag-based filtering with dedicated `Tag` model
- Selenium Grid integration

---

## Glossary

| Term    | Definition                                                                         |
| ------- | ---------------------------------------------------------------------------------- |
| Run     | A single execution of a test suite, producing one TestRunReport                    |
| Suite   | A logical grouping of tests, typically one file or describe block                  |
| Test    | A single test case with a status, duration, and optional error/attachments         |
| Flaky   | A test that failed on first attempt but passed on retry                            |
| Adapter | A CLI tool that converts framework-native XML output into normalized testLens JSON |
| Project | A named container for runs, identified by a URL-safe slug                          |
| API Key | A bearer token used by CI pipelines to authenticate POST /api/runs                 |
| Schema  | The normalized TestRunReport JSON contract all adapters must produce               |
