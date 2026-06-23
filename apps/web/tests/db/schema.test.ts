import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { seedTestUser, cleanupTestUser } from '../helpers/seed'
import {
  projectFactory,
  runFactory,
  suiteFactory,
  testFactory,
  apiKeyFactory,
} from '../helpers/factories'

describe('schema defaults', () => {
  let userId: string
  let projectIds: string[] = []
  let apiKeyIds: string[] = []

  beforeAll(async () => {
    const user = await seedTestUser()
    userId = user.id
  })

  afterEach(async () => {
    if (projectIds.length) {
      await prisma.project.deleteMany({ where: { id: { in: projectIds } } })
      projectIds = []
    }
    if (apiKeyIds.length) {
      await prisma.apiKey.deleteMany({ where: { id: { in: apiKeyIds } } })
      apiKeyIds = []
    }
  })

  afterAll(async () => {
    await cleanupTestUser()
  })

  it('projectFactory: slug is a string, createdAt is a Date', async () => {
    const project = await projectFactory(userId)
    projectIds.push(project.id)
    expect(typeof project.slug).toBe('string')
    expect(project.createdAt).toBeInstanceOf(Date)
  })

  it('runFactory: count fields stored as 0, schemaVersion stored, createdAt is a Date', async () => {
    const project = await projectFactory(userId)
    projectIds.push(project.id)
    const run = await runFactory(project.id, {
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      flaky: 0,
    })
    expect(run.totalTests).toBe(0)
    expect(run.passed).toBe(0)
    expect(run.failed).toBe(0)
    expect(run.skipped).toBe(0)
    expect(run.flaky).toBe(0)
    expect(run.schemaVersion).toBe('1.0.0')
    expect(run.createdAt).toBeInstanceOf(Date)
  })

  it('suiteFactory: duration stored, parentSuite is null when not provided', async () => {
    const project = await projectFactory(userId)
    projectIds.push(project.id)
    const run = await runFactory(project.id)
    const suite = await suiteFactory(run.id)
    expect(suite.duration).toBe(1200)
    expect(suite.parentSuite).toBeNull()
  })

  it('testFactory: status passed, retries 0, tags []', async () => {
    const project = await projectFactory(userId)
    projectIds.push(project.id)
    const run = await runFactory(project.id)
    const suite = await suiteFactory(run.id)
    const test = await testFactory(suite.id)
    expect(test.status).toBe('passed')
    expect(test.retries).toBe(0)
    expect(test.tags).toEqual([])
  })

  it('apiKeyFactory: keyHash stored, lastUsedAt is null, createdAt is a Date', async () => {
    const apiKey = await apiKeyFactory(userId)
    apiKeyIds.push(apiKey.id)
    expect(typeof apiKey.keyHash).toBe('string')
    expect(apiKey.lastUsedAt).toBeNull()
    expect(apiKey.createdAt).toBeInstanceOf(Date)
  })

  it('createdAt is never mutated by an update', async () => {
    const project = await projectFactory(userId)
    projectIds.push(project.id)
    const original = project.createdAt
    await prisma.project.update({ where: { id: project.id }, data: { name: 'Updated' } })
    const refreshed = await prisma.project.findUniqueOrThrow({ where: { id: project.id } })
    expect(refreshed.createdAt.getTime()).toBe(original.getTime())
  })
})
