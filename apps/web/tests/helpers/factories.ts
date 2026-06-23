import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export async function projectFactory(
  userId: string,
  overrides: Partial<Prisma.ProjectUncheckedCreateInput> = {}
) {
  return prisma.project.create({
    data: {
      name: 'Test Project',
      slug: `test-project-${Date.now()}`,
      userId,
      ...overrides,
    },
  })
}

export async function runFactory(
  projectId: string,
  overrides: Partial<Prisma.RunUncheckedCreateInput> = {}
) {
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

export async function suiteFactory(
  runId: string,
  overrides: Partial<Prisma.SuiteUncheckedCreateInput> = {}
) {
  return prisma.suite.create({
    data: {
      name: 'AuthTests',
      duration: 1200,
      runId,
      ...overrides,
    },
  })
}

export async function testFactory(
  suiteId: string,
  overrides: Partial<Prisma.TestUncheckedCreateInput> = {}
) {
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

export async function apiKeyFactory(
  userId: string,
  overrides: Partial<Prisma.ApiKeyUncheckedCreateInput> = {}
) {
  return prisma.apiKey.create({
    data: {
      name: 'Test Key',
      keyHash: 'test-hash-' + Date.now(),
      userId,
      ...overrides,
    },
  })
}
