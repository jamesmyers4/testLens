import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}m ${s}s`
}

function StatCard({
  label,
  value,
  colorClass,
}: {
  label: string
  value: number
  colorClass: string
}) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center">
      <p className={`text-3xl font-bold tabular-nums ${colorClass}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function MetaPill({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs text-foreground" : "text-foreground"}>
        {value}
      </span>
    </div>
  )
}

export default async function RunSummaryPage({
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

  const [run, failedTests] = await Promise.all([
    prisma.run.findUnique({
      where: { id: runId },
      include: { project: true },
    }),
    prisma.test.findMany({
      where: { suite: { runId }, status: "failed" },
      include: { suite: true },
      take: 5,
      orderBy: { title: "asc" },
    }),
  ])

  if (!run || run.project.userId !== dbUser.id || run.project.slug !== slug) {
    notFound()
  }

  const base = `/projects/${slug}/runs/${runId}`
  const runDate = new Date(run.runAt)

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/projects/${slug}`}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← {run.project.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">
          Run{" "}
          {runDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Total" value={run.totalTests} colorClass="text-foreground" />
        <StatCard label="Passed" value={run.passed} colorClass="text-emerald-500" />
        <StatCard label="Failed" value={run.failed} colorClass="text-red-500" />
        <StatCard label="Flaky" value={run.flaky} colorClass="text-amber-400" />
        <StatCard label="Skipped" value={run.skipped} colorClass="text-slate-400" />
      </div>

      <div className="flex flex-wrap gap-2">
        <MetaPill label="Framework" value={run.framework} />
        {run.environment != null && <MetaPill label="Env" value={run.environment} />}
        {run.branch != null && <MetaPill label="Branch" value={run.branch} mono />}
        {run.commitHash != null && (
          <MetaPill label="Commit" value={run.commitHash.slice(0, 7)} mono />
        )}
        <MetaPill label="Duration" value={formatDuration(run.duration)} />
        <MetaPill
          label="Run at"
          value={runDate.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        />
      </div>

      <div className="flex gap-1 border-b border-border">
        {[
          { label: "Suites", href: `${base}/suites`, count: undefined },
          { label: "All Tests", href: `${base}/tests`, count: undefined },
          { label: "Failed", href: `${base}/failed`, count: run.failed },
          { label: "Flaky", href: `${base}/flaky`, count: run.flaky },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex items-center gap-1.5 border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums">
                {tab.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {failedTests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Top Failures</h2>
            {run.failed > 5 && (
              <Link
                href={`${base}/failed`}
                className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
              >
                View all {run.failed} →
              </Link>
            )}
          </div>
          <div className="space-y-2">
            {failedTests.map((test) => (
              <div
                key={test.id}
                className="rounded-lg border border-red-500/20 bg-red-500/5 p-4"
              >
                <p className="text-sm font-medium text-foreground">{test.title}</p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {test.suite.name}
                </p>
                {test.errorMsg != null && (
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded bg-muted p-2 text-xs text-red-500">
                    {test.errorMsg}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {run.failed === 0 && run.flaky === 0 && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
          <p className="font-semibold text-emerald-500">All tests passed</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {run.passed} {run.passed === 1 ? "test" : "tests"} passed in{" "}
            {formatDuration(run.duration)}
          </p>
        </div>
      )}
    </div>
  )
}
