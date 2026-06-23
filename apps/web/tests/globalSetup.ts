import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TEST_CLERK_IDS = [
  process.env.TEST_CLERK_ID ?? 'test_user_id_vitest',
  process.env.TEST_CLERK_ID_B ?? 'test_user_id_vitest_b',
]

async function purge() {
  await prisma.user.deleteMany({ where: { clerkId: { in: TEST_CLERK_IDS } } })
}

export async function setup() {
  await purge()
}

export async function teardown() {
  await purge()
  await prisma.$disconnect()
}
