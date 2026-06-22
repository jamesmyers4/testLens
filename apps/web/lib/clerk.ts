import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function getOrCreateDbUser() {
  const { userId } = await auth()
  if (!userId) throw new Error("Not authenticated")

  const existing = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (existing) return existing

  const clerkUser = await currentUser()
  const email =
    clerkUser?.emailAddresses[0]?.emailAddress ?? `${userId}@unknown.invalid`

  return prisma.user.create({ data: { clerkId: userId, email } })
}
