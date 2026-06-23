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

describe('cascade deletes', () => {
  let userId: string
  let adHocUserIds: string[] = []

  beforeAll(async () => {
    const user = await seedTestUser()
    userId = user.id
  })

  afterEach(async () => {
    if (adHocUserIds.length) {
      try {
        await prisma.user.deleteMany({ where: { id: { in: adHocUserIds } } })
      } catch {}
      adHocUserIds = []
    }
  })

  afterAll(async () => {
    await cleanupTestUser()
  })

  it('deleting a Project cascades to delete its Runs', async () => {
    const project = await projectFactory(userId)
    const run = await runFactory(project.id)

    await prisma.project.delete({ where: { id: project.id } })

    expect(await prisma.run.findUnique({ where: { id: run.id } })).toBeNull()
  })

  it('deleting a Run cascades to delete its Suites', async () => {
    const project = await projectFactory(userId)
    const run = await runFactory(project.id)
    const suite = await suiteFactory(run.id)

    await prisma.run.delete({ where: { id: run.id } })

    expect(await prisma.suite.findUnique({ where: { id: suite.id } })).toBeNull()

    await prisma.project.delete({ where: { id: project.id } })
  })

  it('deleting a Suite cascades to delete its Tests', async () => {
    const project = await projectFactory(userId)
    const run = await runFactory(project.id)
    const suite = await suiteFactory(run.id)
    const test = await testFactory(suite.id)

    await prisma.suite.delete({ where: { id: suite.id } })

    expect(await prisma.test.findUnique({ where: { id: test.id } })).toBeNull()

    await prisma.run.delete({ where: { id: run.id } })
    await prisma.project.delete({ where: { id: project.id } })
  })

  it('deleting a Test cascades to delete its Attachments', async () => {
    const project = await projectFactory(userId)
    const run = await runFactory(project.id)
    const suite = await suiteFactory(run.id)
    const test = await testFactory(suite.id)
    const attachment = await prisma.attachment.create({
      data: { name: 'screenshot.png', type: 'screenshot', testId: test.id },
    })

    await prisma.test.delete({ where: { id: test.id } })

    expect(await prisma.attachment.findUnique({ where: { id: attachment.id } })).toBeNull()

    await prisma.suite.delete({ where: { id: suite.id } })
    await prisma.run.delete({ where: { id: run.id } })
    await prisma.project.delete({ where: { id: project.id } })
  })

  it('deleting a User cascades to delete their Projects', async () => {
    const user = await prisma.user.create({
      data: {
        clerkId: `cascade-projects-${Date.now()}`,
        email: `cascade-projects-${Date.now()}@test.invalid`,
      },
    })
    adHocUserIds.push(user.id)
    const project = await projectFactory(user.id)

    await prisma.user.delete({ where: { id: user.id } })
    adHocUserIds.pop()

    expect(await prisma.project.findUnique({ where: { id: project.id } })).toBeNull()
  })

  it('deleting a User cascades to delete their ApiKeys', async () => {
    const user = await prisma.user.create({
      data: {
        clerkId: `cascade-apikeys-${Date.now()}`,
        email: `cascade-apikeys-${Date.now()}@test.invalid`,
      },
    })
    adHocUserIds.push(user.id)
    const apiKey = await apiKeyFactory(user.id)

    await prisma.user.delete({ where: { id: user.id } })
    adHocUserIds.pop()

    expect(await prisma.apiKey.findUnique({ where: { id: apiKey.id } })).toBeNull()
  })

  it('deleting a Project does not affect other Projects owned by the same user', async () => {
    const projectA = await projectFactory(userId)
    const projectB = await projectFactory(userId)

    await prisma.project.delete({ where: { id: projectA.id } })

    expect(await prisma.project.findUnique({ where: { id: projectB.id } })).not.toBeNull()

    await prisma.project.delete({ where: { id: projectB.id } })
  })
})
