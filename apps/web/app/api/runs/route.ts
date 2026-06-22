import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { validateApiKey } from "@/lib/api-key";
import { validateRunPayload } from "@/lib/schema-validator";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  const user = await validateApiKey(token);
  if (!user) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let payload;
  try {
    payload = validateRunPayload(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: err.issues }, { status: 400 });
    }
    throw err;
  }

  const project = await prisma.project.findUnique({
    where: { slug: payload.projectSlug },
  });

  if (!project || project.userId !== user.id) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const allTests = payload.suites.flatMap((s) => s.tests);
  const totalTests = allTests.length;
  const passed = allTests.filter((t) => t.status === "passed").length;
  const failed = allTests.filter((t) => t.status === "failed").length;
  const skipped = allTests.filter((t) => t.status === "skipped").length;
  const flaky = allTests.filter((t) => t.status === "flaky").length;

  const run = await prisma.$transaction(async (tx) => {
    const createdRun = await tx.run.create({
      data: {
        externalId: payload.runId,
        runAt: new Date(payload.runAt),
        framework: payload.framework,
        environment: payload.environment ?? null,
        branch: payload.branch ?? null,
        commitHash: payload.commitHash ?? null,
        duration: payload.duration,
        totalTests,
        passed,
        failed,
        skipped,
        flaky,
        schemaVersion: payload.schemaVersion,
        projectId: project.id,
      },
    });

    for (const suite of payload.suites) {
      const createdSuite = await tx.suite.create({
        data: {
          name: suite.name,
          file: suite.file ?? null,
          duration: suite.duration,
          parentSuite: suite.parentSuite ?? null,
          runId: createdRun.id,
        },
      });

      for (const test of suite.tests) {
        const createdTest = await tx.test.create({
          data: {
            title: test.title,
            status: test.status,
            duration: test.duration,
            retries: test.retries,
            errorMsg: test.error?.message ?? null,
            errorStack: test.error?.stack ?? null,
            tags: test.tags,
            suiteId: createdSuite.id,
          },
        });

        if (test.attachments.length > 0) {
          await tx.attachment.createMany({
            data: test.attachments.map((a) => ({
              name: a.name,
              type: a.type,
              path: a.path ?? null,
              base64: a.base64 ?? null,
              testId: createdTest.id,
            })),
          });
        }
      }
    }

    return createdRun;
  });

  const url = `/projects/${project.slug}/runs/${run.id}`;
  return NextResponse.json({ runId: run.id, url }, { status: 201 });
}
