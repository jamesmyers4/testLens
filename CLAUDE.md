# testLens — CLAUDE.md

## Who You Are

You are Claude Code, executing build sessions for testLens — a multi-framework test run dashboard for Selenium/xUnit/NUnit shops. You write TypeScript, follow the decisions in CONTEXT.md exactly, and never commit or push without explicit owner instruction. After every file change that includes TypeScript, run `tsc --noEmit` and fix all errors before moving on.

---

## Absolute Rules

- Never commit or push — owner reviews all changes before any git operation
- Never deviate from the route structure, schema, or stack defined in CONTEXT.md
- Never install a package not listed in this file or approved mid-session
- Run `tsc --noEmit` after every TypeScript file change
- If something is ambiguous, stop and ask — do not assume
- Leave no TypeScript errors unresolved at end of session
- No code comments — clean code only

---

## Repo Structure (target state)

```
testlens/
  apps/
    web/                        ← Next.js 15 App Router
      app/
        (auth)/                 ← Clerk-protected layout
          layout.tsx
          page.tsx              ← / home, lists projects
          projects/
            new/
              page.tsx
            [slug]/
              page.tsx          ← project dashboard, lists runs
              upload/
                page.tsx
              runs/
                [runId]/
                  page.tsx      ← run summary
                  suites/
                    page.tsx
                  tests/
                    page.tsx
                  failed/
                    page.tsx
                  flaky/
                    page.tsx
          settings/
            page.tsx
        api/
          runs/
            route.ts            ← POST /api/runs
            [runId]/
              route.ts          ← GET /api/runs/[runId]
          projects/
            [slug]/
              badge/
                route.ts        ← GET badge SVG
        layout.tsx              ← root layout, dark mode provider
        globals.css
      components/
        ui/                     ← shadcn/ui components
        run-summary-card.tsx
        suite-row.tsx
        test-row.tsx
        status-badge.tsx
        theme-toggle.tsx
        upload-dropzone.tsx
      lib/
        prisma.ts
        clerk.ts
        api-key.ts
        schema-validator.ts
      prisma/
        schema.prisma
      middleware.ts
  packages/
    schema/
      src/
        index.ts                ← TestRunReport types
      package.json
      tsconfig.json
    adapter-xunit/
      src/
        index.ts                ← CLI entry point
        parser.ts               ← xUnit XML → TestRunReport
      package.json
      tsconfig.json
    adapter-nunit/
      src/
        index.ts
        parser.ts               ← NUnit XML → TestRunReport
      package.json
      tsconfig.json
  examples/
    github-actions.yml
  CONTEXT.md
  CLAUDE.md
  package.json                  ← monorepo root (npm workspaces)
  tsconfig.base.json
```

---

## Package Versions (pin these exactly)

```
next: 15.x
react: 19.x
typescript: 5.x
prisma: 6.x
@prisma/client: 6.x
@clerk/nextjs: 6.x
tailwindcss: 4.x
shadcn/ui: latest
zod: 3.x
fast-xml-parser: 4.x
uuid: 10.x
@types/uuid: 10.x
```

---

## Status Color Map (Tailwind)

| Status   | Class                             |
| -------- | --------------------------------- |
| passed   | text-emerald-500 / bg-emerald-500 |
| failed   | text-red-500 / bg-red-500         |
| flaky    | text-amber-400 / bg-amber-400     |
| skipped  | text-slate-400 / bg-slate-400     |
| duration | text-blue-400                     |

---

## Environment Variables

```
# apps/web/.env.local
DATABASE_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

Owner fills these in manually — never generate or assume values.

---

## Key Decisions (do not re-litigate these)

- Monorepo via npm workspaces — no Turborepo, no Nx
- Flat suites with optional `parentSuite` string — no nesting
- `flaky` is a first-class test status
- `attachments` array is in schema — screenshot viewer UI is v2
- API-first ingest (`POST /api/runs`) — file upload is fallback
- Single-user auth via Clerk — no teams or roles in v1
- API keys hashed before storage — never stored plaintext
- Dark mode default, light mode toggle via next-themes
- shadcn/ui components only — no other component library
- xUnit and NUnit adapters ship in v1 — Playwright adapter is v2

---

## SESSION 1 — Monorepo Scaffold + Schema Package (DONE)

### Goal

Initialize the monorepo, scaffold the Next.js app, set up npm workspaces, create the `packages/schema` package with full TypeScript types, and verify everything compiles clean.

### Steps

1. Initialize root `package.json` with npm workspaces pointing to `apps/*` and `packages/*`
2. Create `tsconfig.base.json` at root with strict mode
3. Scaffold `packages/schema`:
   - `package.json` with name `@testlens/schema`
   - `tsconfig.json` extending base
   - `src/index.ts` exporting all types: `TestRunReport`, `Suite`, `Test`, `Attachment`, `TestStatus`, `Framework`, `Environment`
4. Scaffold `apps/web` with `create-next-app` — App Router, TypeScript, Tailwind, no ESLint auto-config
5. Add `@testlens/schema` as a workspace dependency in `apps/web/package.json`
6. Run `tsc --noEmit` from root — zero errors required before session ends
7. Verify `packages/schema` types are importable from `apps/web`

### Done When

- `npm install` from root succeeds
- `tsc --noEmit` from root passes clean
- Schema types are importable in a throwaway `apps/web/app/test-import.ts` file (delete after verify)

---

## SESSION 2 — Prisma + Neon + Clerk (CURRENT SESSION)

#### Goal

Wire up the database and authentication. No UI yet — just infrastructure that works and is verified.

Steps

Install Prisma in apps/web, initialize with prisma init
Write apps/web/prisma/schema.prisma — full model from CONTEXT.md including User, Project, Run, Suite, Test, Attachment, ApiKey
Owner sets DATABASE_URL in .env.local (Neon connection string) — wait for confirmation before continuing
Run npx prisma db push to sync schema to Neon
Create apps/web/lib/prisma.ts singleton client
Install and configure Clerk: @clerk/nextjs
Wrap apps/web/app/layout.tsx with <ClerkProvider>
Add apps/web/middleware.ts protecting all routes except /api/runs (public — CI pipelines call this unauthenticated with API key) and /api/projects/[slug]/badge (public)
Create placeholder sign-in and sign-up pages at /sign-in and /sign-up using Clerk components
Run tsc --noEmit — zero errors

Done When

npx prisma studio opens and shows all tables
Visiting a protected route redirects to /sign-in
tsc --noEmit passes clean
