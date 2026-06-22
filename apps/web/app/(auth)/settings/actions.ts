"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { generateApiKey, hashApiKey } from "@/lib/api-key"
import { getOrCreateDbUser } from "@/lib/clerk"

export async function createApiKey(name: string): Promise<{ rawKey: string }> {
  const user = await getOrCreateDbUser()
  const rawKey = generateApiKey()
  const keyHash = hashApiKey(rawKey)

  await prisma.apiKey.create({
    data: { name, keyHash, userId: user.id },
  })

  revalidatePath("/settings")
  return { rawKey }
}

export async function revokeApiKey(id: string): Promise<void> {
  const user = await getOrCreateDbUser()

  await prisma.apiKey.deleteMany({ where: { id, userId: user.id } })

  revalidatePath("/settings")
}
