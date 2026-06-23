import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { SuiteRow } from "@/components/suite-row"

export default async function SuitesPage({
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
    include: {
      project: true,
      suites: {
        include: {
          tests: {
            select: {
              id: true,
              title: true,
              status: true,
              duration: true,
              retries: true,
              tags: true,
            },
          },
        },
      },
    },
  })

  if (!run || run.project.userId !== dbUser.id || run.project.slug !== slug) {
    notFound()
  }

  const suites = run.suites
    .map((suite) => ({
      id: suite.id,
      name: suite.name,
      file: suite.file,
      duration: suite.duration,
      passed: suite.tests.filter((t) => t.status === "passed").length,
      failed: suite.tests.filter((t) => t.status === "failed").length,
      flaky: suite.tests.filter((t) => t.status === "flaky").length,
      skipped: suite.tests.filter((t) => t.status === "skipped").length,
      tests: suite.tests,
    }))
    .sort((a, b) => b.failed - a.failed)

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
        <h1 className="mt-2 text-2xl font-bold text-foreground">Suite Breakdown</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {suites.length} {suites.length === 1 ? "suite" : "suites"} · sorted by failures
        </p>
      </div>

      {suites.length === 0 ? (
        <p className="text-sm text-muted-foreground">No suites in this run.</p>
      ) : (
        <div className="space-y-2">
          {suites.map((suite) => (
            <SuiteRow key={suite.id} suite={suite} />
          ))}
        </div>
      )}
    </div>
  )
}
