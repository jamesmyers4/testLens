"use server"

import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getOrCreateDbUser } from "@/lib/clerk"

export async function createProject(
  name: string,
  slug: string
): Promise<{ error: string }> {
  const user = await getOrCreateDbUser()

  const existing = await prisma.project.findUnique({ where: { slug } })
  if (existing) return { error: "A project with this slug already exists." }

  const project = await prisma.project.create({
    data: { name, slug, userId: user.id },
  })

  redirect(`/projects/${project.slug}`)
}
