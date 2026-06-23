import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { seedTestUser, seedTestUserB, cleanupTestUser } from '../helpers/seed'
import { projectFactory, runFactory, apiKeyFactory } from '../helpers/factories'

describe('ownership isolation', () => {
  let userAId: string
  let userBId: string
  let projectBId: string
  let apiKeyBId: string
  let runIds: string[] = []

  beforeAll(async () => {
    const userA = await seedTestUser()
    const userB = await seedTestUserB()
    userAId = userA.id
    userBId = userB.id
    const projectB = await projectFactory(userBId)
    projectBId = projectB.id
    const apiKeyB = await apiKeyFactory(userBId)
    apiKeyBId = apiKeyB.id
  })

  afterEach(async () => {
    if (runIds.length) {
      await prisma.run.deleteMany({ where: { id: { in: runIds } } })
      runIds = []
    }
  })

  afterAll(async () => {
    await cleanupTestUser()
  })

  it('userA cannot read userB project via userId filter', async () => {
    const result = await prisma.project.findFirst({
      where: { id: projectBId, userId: userAId },
    })
    expect(result).toBeNull()
  })

  it('userA cannot read userB run via project join', async () => {
    const run = await runFactory(projectBId)
    runIds.push(run.id)
    const result = await prisma.run.findFirst({
      where: { id: run.id, project: { userId: userAId } },
    })
    expect(result).toBeNull()
  })

  it('userA cannot update userB project via updateMany', async () => {
    const result = await prisma.project.updateMany({
      where: { id: projectBId, userId: userAId },
      data: { name: 'Hacked' },
    })
    expect(result.count).toBe(0)
    const project = await prisma.project.findUniqueOrThrow({ where: { id: projectBId } })
    expect(project.name).not.toBe('Hacked')
  })

  it('userA cannot read userB apiKey via userId filter', async () => {
    const result = await prisma.apiKey.findFirst({
      where: { id: apiKeyBId, userId: userAId },
    })
    expect(result).toBeNull()
  })

  it('userA cannot revoke userB apiKey via deleteMany', async () => {
    const result = await prisma.apiKey.deleteMany({
      where: { id: apiKeyBId, userId: userAId },
    })
    expect(result.count).toBe(0)
    const apiKey = await prisma.apiKey.findUnique({ where: { id: apiKeyBId } })
    expect(apiKey).not.toBeNull()
  })
})
