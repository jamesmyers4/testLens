import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"

type RunStatus = "passed" | "failed" | "flaky" | "skipped"

function deriveStatus(run: { failed: number; flaky: number; passed: number }): RunStatus {
  if (run.failed > 0) return "failed"
  if (run.flaky > 0) return "flaky"
  if (run.passed > 0) return "passed"
  return "skipped"
}

export default async function HomePage() {
  const { userId } = await auth()

  const dbUser = userId
    ? await prisma.user.findUnique({ where: { clerkId: userId } })
    : null

  const projects = dbUser
    ? await prisma.project.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { runs: true } },
          runs: {
            orderBy: { runAt: "desc" },
            take: 1,
            select: {
              id: true,
              runAt: true,
              passed: true,
              failed: true,
              flaky: true,
              skipped: true,
            },
          },
        },
      })
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Projects</h1>
        <Button asChild>
          <Link href="/projects/new">New Project</Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-normal text-muted-foreground">
              No projects yet
            </CardTitle>
            <CardDescription>
              Create a project and start ingesting test runs via the API or file upload.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const lastRun = project.runs[0]
            return (
              <Link key={project.id} href={`/projects/${project.slug}`}>
                <Card className="cursor-pointer transition-colors hover:border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{project.name}</CardTitle>
                    <CardDescription className="font-mono text-xs">{project.slug}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {project._count.runs} {project._count.runs === 1 ? "run" : "runs"}
                    </span>
                    {lastRun ? (
                      <div className="flex items-center gap-2">
                        <StatusBadge status={deriveStatus(lastRun)} />
                        <span className="text-xs text-muted-foreground">
                          {new Date(lastRun.runAt).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No runs yet</span>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
