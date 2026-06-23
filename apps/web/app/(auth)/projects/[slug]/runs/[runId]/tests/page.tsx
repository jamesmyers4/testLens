import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { TestRow } from "@/components/test-row"

const STATUSES = ["passed", "failed", "flaky", "skipped"] as const

const statusActiveClass: Record<string, string> = {
  passed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  failed: "border-red-500/30 bg-red-500/10 text-red-500",
  flaky: "border-amber-400/30 bg-amber-400/10 text-amber-400",
  skipped: "border-slate-400/30 bg-slate-400/10 text-slate-400",
}

export default async function TestsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; runId: string }>
  searchParams: Promise<{ status?: string; tag?: string }>
}) {
  const { slug, runId } = await params
  const { status, tag } = await searchParams
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

  const allTests = await prisma.test.findMany({
    where: { suite: { runId } },
    include: { suite: { select: { name: true } } },
    orderBy: { title: "asc" },
  })

  const allTags = [...new Set(allTests.flatMap((t) => t.tags))].sort()

  const filtered = allTests.filter((t) => {
    if (status && t.status !== status) return false
    if (tag && !t.tags.includes(tag)) return false
    return true
  })

  const base = `/projects/${slug}/runs/${runId}`

  const filterHref = (newStatus: string | null, newTag: string | null) => {
    const p = new URLSearchParams()
    if (newStatus) p.set("status", newStatus)
    if (newTag) p.set("tag", newTag)
    const qs = p.toString()
    return `${base}/tests${qs ? `?${qs}` : ""}`
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={base}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Run Summary
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">All Tests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {filtered.length} of {allTests.length} tests
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Link
            href={filterHref(null, tag ?? null)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              !status
                ? "border-border bg-muted text-foreground"
                : "border-transparent text-muted-foreground hover:bg-muted"
            }`}
          >
            All
          </Link>
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={filterHref(s, tag ?? null)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                status === s
                  ? statusActiveClass[s]
                  : "border-transparent text-muted-foreground hover:bg-muted"
              }`}
            >
              {s}
            </Link>
          ))}
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map((t) => (
              <Link
                key={t}
                href={filterHref(status ?? null, tag === t ? null : t)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  tag === t
                    ? "border-border bg-muted text-foreground"
                    : "border-transparent text-muted-foreground hover:bg-muted"
                }`}
              >
                #{t}
              </Link>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tests match the current filter.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((test) => (
            <TestRow key={test.id} test={test} showSuite />
          ))}
        </div>
      )}
    </div>
  )
}
