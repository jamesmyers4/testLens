import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { TestRow } from "@/components/test-row"

export default async function FailedPage({
  params,
}: {
  params: Promise<{ slug: string; runId: string }>
}) {
  const { slug, runId } = await params
  const { userId } = await auth()

  const dbUser = userId
    ? await prisma.user.findUnique({ where: { clerkId: userId } })
    : null
  if (!dbUser) notFound()

  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: { project: true },
  })

  if (!run || run.project.userId !== dbUser.id || run.project.slug !== slug) {
    notFound()
  }

  const tests = await prisma.test.findMany({
    where: { suite: { runId }, status: "failed" },
    include: { suite: { select: { name: true } } },
    orderBy: { title: "asc" },
  })

  const base = `/projects/${slug}/runs/${runId}`

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={base}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Run Summary
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Failed Tests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tests.length} {tests.length === 1 ? "failure" : "failures"}
        </p>
      </div>

      {tests.length === 0 ? (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
          <p className="font-semibold text-emerald-500">No failures</p>
          <p className="mt-1 text-sm text-muted-foreground">This run had no failed tests.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tests.map((test) => (
            <TestRow key={test.id} test={test} showSuite alwaysShowError />
          ))}
        </div>
      )}
    </div>
  )
}
