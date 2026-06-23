import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type Mock } from 'vitest'
import { auth } from '@clerk/nextjs/server'
import { createApiKey, revokeApiKey } from '@/app/(auth)/settings/actions'
import { validateApiKey } from '@/lib/api-key'
import { prisma } from '@/lib/prisma'
import { seedTestUser, seedTestUserB, cleanupTestUser } from '../helpers/seed'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

const TEST_CLERK_ID = process.env.TEST_CLERK_ID ?? 'test_user_id_vitest'
const TEST_CLERK_ID_B = process.env.TEST_CLERK_ID_B ?? 'test_user_id_vitest_b'

describe('api-keys', () => {
  let userAId: string
  let userBId: string

  beforeAll(async () => {
    const userA = await seedTestUser()
    const userB = await seedTestUserB()
    userAId = userA.id
    userBId = userB.id
  })

  afterAll(async () => {
    await cleanupTestUser()
  })

  beforeEach(() => {
    ;(auth as unknown as Mock).mockResolvedValue({ userId: TEST_CLERK_ID })
  })

  describe('createApiKey', () => {
    it('creates key, returns raw value once, stores hash only', async () => {
      const { rawKey } = await createApiKey('My Test Key')

      expect(rawKey).toMatch(/^tlk_/)

      const record = await prisma.apiKey.findFirst({
        where: { userId: userAId, name: 'My Test Key' },
      })

      expect(record).not.toBeNull()
      expect(record!.keyHash).not.toBe(rawKey)
    })

    it('allows duplicate names', async () => {
      await createApiKey('Duplicate Name')
      await createApiKey('Duplicate Name')

      const records = await prisma.apiKey.findMany({
        where: { userId: userAId, name: 'Duplicate Name' },
      })

      expect(records).toHaveLength(2)
    })
  })

  describe('revokeApiKey', () => {
    it('removes key from DB', async () => {
      await createApiKey('Key To Revoke')
      const record = await prisma.apiKey.findFirst({
        where: { userId: userAId, name: 'Key To Revoke' },
      })

      await revokeApiKey(record!.id)

      const deleted = await prisma.apiKey.findUnique({ where: { id: record!.id } })
      expect(deleted).toBeNull()
    })

    it("cannot revoke another user's key", async () => {
      ;(auth as unknown as Mock).mockResolvedValue({ userId: TEST_CLERK_ID })
      await createApiKey("User A's Key")
      const record = await prisma.apiKey.findFirst({
        where: { userId: userAId, name: "User A's Key" },
      })

      ;(auth as unknown as Mock).mockResolvedValue({ userId: TEST_CLERK_ID_B })
      await revokeApiKey(record!.id)

      const stillExists = await prisma.apiKey.findUnique({ where: { id: record!.id } })
      expect(stillExists).not.toBeNull()
    })
  })

  describe('validateApiKey', () => {
    it('valid raw key returns user and updates lastUsedAt', async () => {
      ;(auth as unknown as Mock).mockResolvedValue({ userId: TEST_CLERK_ID })
      const { rawKey } = await createApiKey('Valid Key Test')

      const before = new Date()
      const user = await validateApiKey(rawKey)
      const after = new Date()

      expect(user).not.toBeNull()
      expect(user!.clerkId).toBe(TEST_CLERK_ID)

      const record = await prisma.apiKey.findFirst({
        where: { userId: userAId, name: 'Valid Key Test' },
      })
      expect(record!.lastUsedAt).not.toBeNull()
      expect(record!.lastUsedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(record!.lastUsedAt!.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('invalid key returns null', async () => {
      const result = await validateApiKey('tlk_invalid_key_that_does_not_exist')
      expect(result).toBeNull()
    })

    it('revoked key returns null', async () => {
      ;(auth as unknown as Mock).mockResolvedValue({ userId: TEST_CLERK_ID })
      const { rawKey } = await createApiKey('Key To Revoke For Validate Test')
      const record = await prisma.apiKey.findFirst({
        where: { userId: userAId, name: 'Key To Revoke For Validate Test' },
      })

      await revokeApiKey(record!.id)

      const result = await validateApiKey(rawKey)
      expect(result).toBeNull()
    })
  })
})
