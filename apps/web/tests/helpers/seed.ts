import { prisma } from '@/lib/prisma'
import { hashApiKey } from '@/lib/api-key'

const TEST_CLERK_ID = process.env.TEST_CLERK_ID ?? 'test_user_id_vitest'
const TEST_CLERK_ID_B = process.env.TEST_CLERK_ID_B ?? 'test_user_id_vitest_b'

export async function seedTestUser() {
  return prisma.user.upsert({
    where: { clerkId: TEST_CLERK_ID },
    update: {},
    create: {
      clerkId: TEST_CLERK_ID,
      email: `${TEST_CLERK_ID}@test.invalid`,
    },
  })
}

export async function seedTestUserB() {
  return prisma.user.upsert({
    where: { clerkId: TEST_CLERK_ID_B },
    update: {},
    create: {
      clerkId: TEST_CLERK_ID_B,
      email: `${TEST_CLERK_ID_B}@test.invalid`,
    },
  })
}

export async function seedTestApiKey(userId: string): Promise<{ rawKey: string }> {
  const rawKey = process.env.TESTLENS_API_KEY ?? 'tlk_test_static_key_for_vitest'
  const keyHash = hashApiKey(rawKey)
  await prisma.apiKey.upsert({
    where: { keyHash },
    update: {},
    create: {
      name: 'Vitest Static Key',
      keyHash,
      userId,
    },
  })
  return { rawKey }
}

export async function cleanupTestUser(): Promise<void> {
  for (const clerkId of [TEST_CLERK_ID, TEST_CLERK_ID_B]) {
    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) continue

    const projects = await prisma.project.findMany({ where: { userId: user.id } })
    const projectIds = projects.map((p) => p.id)

    const runs = projectIds.length
      ? await prisma.run.findMany({ where: { projectId: { in: projectIds } } })
      : []
    const runIds = runs.map((r) => r.id)

    const suites = runIds.length
      ? await prisma.suite.findMany({ where: { runId: { in: runIds } } })
      : []
    const suiteIds = suites.map((s) => s.id)

    const tests = suiteIds.length
      ? await prisma.test.findMany({ where: { suiteId: { in: suiteIds } } })
      : []
    const testIds = tests.map((t) => t.id)

    if (testIds.length) {
      await prisma.attachment.deleteMany({ where: { testId: { in: testIds } } })
      await prisma.test.deleteMany({ where: { id: { in: testIds } } })
    }
    if (suiteIds.length) await prisma.suite.deleteMany({ where: { id: { in: suiteIds } } })
    if (runIds.length) await prisma.run.deleteMany({ where: { id: { in: runIds } } })
    if (projectIds.length) await prisma.project.deleteMany({ where: { id: { in: projectIds } } })
    await prisma.apiKey.deleteMany({ where: { userId: user.id } })
    await prisma.user.delete({ where: { id: user.id } })
  }
}
