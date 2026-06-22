import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"

const PAGE_SIZE = 20

type RunStatus = "passed" | "failed" | "flaky" | "skipped"

function deriveStatus(run: { failed: number; flaky: number; passed: number }): RunStatus {
  if (run.failed > 0) return "failed"
  if (run.flaky > 0) return "flaky"
  if (run.passed > 0) return "passed"
  return "skipped"
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}m ${s}s`
}

export default async function ProjectDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1", 10))

  const { userId } = await auth()
  const dbUser = userId
    ? await prisma.user.findUnique({ where: { clerkId: userId } })
    : null
  if (!dbUser) notFound()

  const project = await prisma.project.findFirst({
    where: { slug, userId: dbUser.id },
  })
  if (!project) notFound()

  const [runs, totalCount] = await Promise.all([
    prisma.run.findMany({
      where: { projectId: project.id },
      orderBy: { runAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.run.count({ where: { projectId: project.id } }),
  ])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          <p className="mt-0.5 font-mono text-sm text-muted-foreground">{project.slug}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/projects/${slug}/upload`}>Upload run</Link>
        </Button>
      </div>

      {runs.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="font-medium text-muted-foreground">No runs yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingest via{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              POST /api/runs
            </code>{" "}
            with your API key, or{" "}
            <Link
              href={`/projects/${slug}/upload`}
              className="underline underline-offset-4 transition-colors hover:text-foreground"
            >
              upload a file
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Framework</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Env</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Branch</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Commit</th>
                  <th className="px-4 py-3 text-right font-medium text-emerald-500">Pass</th>
                  <th className="px-4 py-3 text-right font-medium text-red-500">Fail</th>
                  <th className="px-4 py-3 text-right font-medium text-amber-400">Flaky</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-400">Skip</th>
                  <th className="px-4 py-3 text-right font-medium text-blue-400">Duration</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr
                    key={run.id}
                    className="border-b transition-colors last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/projects/${slug}/runs/${run.id}`}
                        className="flex items-center gap-2 hover:underline"
                      >
                        <StatusBadge status={deriveStatus(run)} />
                        <span className="text-muted-foreground">
                          {new Date(run.runAt).toLocaleDateString()}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {run.framework}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {run.environment ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {run.branch ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {run.commitHash ? run.commitHash.slice(0, 7) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-500">{run.passed}</td>
                    <td className="px-4 py-3 text-right text-red-500">{run.failed}</td>
                    <td className="px-4 py-3 text-right text-amber-400">{run.flaky}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{run.skipped}</td>
                    <td className="px-4 py-3 text-right text-blue-400">
                      {formatDuration(run.duration)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} runs
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/projects/${slug}?page=${page - 1}`}>Previous</Link>
                  </Button>
                )}
                {page < totalPages && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/projects/${slug}?page=${page + 1}`}>Next</Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
