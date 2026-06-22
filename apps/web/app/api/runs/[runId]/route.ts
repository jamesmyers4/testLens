import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { runId } = await params;

  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: {
      project: true,
      suites: {
        include: {
          tests: {
            include: {
              attachments: true,
            },
          },
        },
      },
    },
  });

  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user || run.project.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(run);
}
