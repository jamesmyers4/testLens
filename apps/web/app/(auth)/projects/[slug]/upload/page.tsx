import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { UploadDropzone } from "@/components/upload-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function UploadPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { userId } = await auth()

  const dbUser = userId
    ? await prisma.user.findUnique({ where: { clerkId: userId } })
    : null
  if (!dbUser) notFound()

  const project = await prisma.project.findFirst({
    where: { slug, userId: dbUser.id },
  })
  if (!project) notFound()

  const apiKeyCount = await prisma.apiKey.count({ where: { userId: dbUser.id } })

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/projects/${slug}`}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← {project.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Upload Run</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Upload a testlens-run.json file for{" "}
          <span className="font-mono">{slug}</span>
        </p>
      </div>

      <UploadDropzone />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manual Upload</CardTitle>
            <CardDescription>
              Convert your XML test output to JSON with testlens-convert, then
              drag and drop the file above.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded bg-muted p-3 text-xs text-muted-foreground">
              {`testlens-convert \\
  --input TestResults.xml \\
  --framework xunit \\
  --project ${slug} \\
  --out testlens-run.json`}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">CI Pipeline (Recommended)</CardTitle>
            <CardDescription>
              Automate ingest from GitHub Actions using an API key — no manual
              steps after initial setup.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {apiKeyCount > 0 ? (
              <p>
                You have API keys configured.{" "}
                <Link
                  href="/settings"
                  className="underline underline-offset-4 transition-colors hover:text-foreground"
                >
                  Manage keys →
                </Link>
              </p>
            ) : (
              <p>
                No API keys yet.{" "}
                <Link
                  href="/settings"
                  className="underline underline-offset-4 transition-colors hover:text-foreground"
                >
                  Create one in Settings →
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
