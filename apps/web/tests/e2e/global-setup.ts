import { chromium } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') })

const AUTH_FILE = path.resolve(__dirname, '../helpers/.auth.json')
const STATE_FILE = path.resolve(__dirname, '../helpers/.e2e-state.json')
const BASE_URL = 'http://localhost:3000'
const E2E_PROJECT_SLUG = 'e2e-test-project'
const CLERK_API = 'https://api.clerk.com/v1'

async function clerkApi<T = unknown>(apiPath: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${CLERK_API}${apiPath}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Clerk API ${apiPath} → ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

async function deleteProject(prisma: PrismaClient, projectId: string) {
  const runs = await prisma.run.findMany({ where: { projectId }, select: { id: true } })
  const runIds = runs.map((r) => r.id)
  if (runIds.length) {
    const suites = await prisma.suite.findMany({ where: { runId: { in: runIds } }, select: { id: true } })
    const suiteIds = suites.map((s) => s.id)
    if (suiteIds.length) {
      const testIds = (await prisma.test.findMany({ where: { suiteId: { in: suiteIds } }, select: { id: true } })).map((t) => t.id)
      if (testIds.length) {
        await prisma.attachment.deleteMany({ where: { testId: { in: testIds } } })
        await prisma.test.deleteMany({ where: { id: { in: testIds } } })
      }
      await prisma.suite.deleteMany({ where: { id: { in: suiteIds } } })
    }
    await prisma.run.deleteMany({ where: { id: { in: runIds } } })
  }
  await prisma.project.delete({ where: { id: projectId } })
}

export default async function globalSetup() {
  const email = process.env.E2E_CLERK_EMAIL ?? ''

  const users = await clerkApi<Array<{ id: string }>>(
    `/users?email_address[]=${encodeURIComponent(email)}&limit=1`
  )
  if (!users.length) throw new Error(`No Clerk user found for email: ${email}`)
  const clerkUserId = users[0].id

  const { token } = await clerkApi<{ token: string }>('/sign_in_tokens', {
    method: 'POST',
    body: JSON.stringify({ user_id: clerkUserId, expires_in_seconds: 60 }),
  })

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(`${BASE_URL}/sign-in#/?__clerk_ticket=${token}`)
  await page.waitForURL((url) => !url.pathname.includes('/sign-in'), { timeout: 20000 })

  await context.storageState({ path: AUTH_FILE })
  await browser.close()

  const prisma = new PrismaClient()

  try {
    const user = await prisma.user.upsert({
      where: { clerkId: clerkUserId },
      update: {},
      create: { clerkId: clerkUserId, email },
    })

    // Clean up stale API keys from previous test runs
    await prisma.apiKey.deleteMany({ where: { userId: user.id } })

    // Clean up stale e2e projects from previous test runs
    const staleProjects = await prisma.project.findMany({
      where: {
        userId: user.id,
        OR: [
          { slug: { startsWith: 'e2e-new-' } },
          { slug: { startsWith: 'e2e-empty-' } },
        ],
      },
      select: { id: true },
    })
    for (const p of staleProjects) {
      await deleteProject(prisma, p.id)
    }

    const existing = await prisma.project.findUnique({ where: { slug: E2E_PROJECT_SLUG } })
    if (existing) {
      await deleteProject(prisma, existing.id)
    }

    const project = await prisma.project.create({
      data: { name: 'E2E Test Project', slug: E2E_PROJECT_SLUG, userId: user.id },
    })

    const run = await prisma.run.create({
      data: {
        runAt: new Date('2024-01-15T10:00:00Z'),
        framework: 'xunit',
        environment: 'ci',
        branch: 'main',
        commitHash: 'abc1234def',
        duration: 12500,
        totalTests: 8,
        passed: 4,
        failed: 2,
        skipped: 1,
        flaky: 1,
        schemaVersion: '1.0.0',
        projectId: project.id,
      },
    })

    const suite1 = await prisma.suite.create({
      data: { name: 'AuthTests', duration: 5000, runId: run.id },
    })
    const suite2 = await prisma.suite.create({
      data: { name: 'DatabaseTests', duration: 7500, runId: run.id },
    })

    await prisma.test.createMany({
      data: [
        { title: 'Login_WithValidCredentials_Passes', status: 'passed', duration: 400, retries: 0, tags: [], suiteId: suite1.id },
        { title: 'Login_WithInvalidPassword_Fails', status: 'failed', duration: 350, retries: 0, errorMsg: 'Expected status 200 but got 401', errorStack: 'Error: Expected 200\n  at AuthTests.cs:23\n  at TestRunner:line 5', tags: [], suiteId: suite1.id },
        { title: 'Logout_ClearsSession', status: 'passed', duration: 200, retries: 0, tags: [], suiteId: suite1.id },
        { title: 'Login_FlakySSORedirect', status: 'flaky', duration: 800, retries: 2, tags: [], suiteId: suite1.id },
        { title: 'Insert_WithValidData_Succeeds', status: 'passed', duration: 1200, retries: 0, tags: [], suiteId: suite2.id },
        { title: 'Insert_WithDuplicateKey_Throws', status: 'failed', duration: 900, retries: 0, errorMsg: 'Unique constraint violation on column: email', errorStack: 'Error: Unique constraint\n  at DatabaseTests.cs:45\n  at TestRunner:line 5', tags: [], suiteId: suite2.id },
        { title: 'Select_AllRecords_ReturnsList', status: 'passed', duration: 300, retries: 0, tags: [], suiteId: suite2.id },
        { title: 'Delete_NonExistent_Skipped', status: 'skipped', duration: 0, retries: 0, tags: [], suiteId: suite2.id },
      ],
    })

    fs.writeFileSync(
      STATE_FILE,
      JSON.stringify({ projectSlug: E2E_PROJECT_SLUG, projectName: 'E2E Test Project', runId: run.id, userId: user.id }, null, 2)
    )
  } finally {
    await prisma.$disconnect()
  }
}
